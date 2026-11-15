/**
 * 从审核表(audit)迁移认证数据到用户认证表(user_verification)
 * 解析audit表中的content字段（HTML格式），提取认证信息
 */

const { pool } = require('../config/config');

async function checkTableExists(tableName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
    [tableName]
  );
  return rows[0].count > 0;
}

async function checkColumnExists(tableName, columnName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return rows[0].count > 0;
}

async function checkIndexExists(tableName, indexName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  return rows[0].count > 0;
}

async function checkForeignKeyExists(tableName, fkName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) as count
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND CONSTRAINT_NAME = ?
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [tableName, fkName]
  );
  return rows[0].count > 0;
}

async function ensureAuditTableUpToDate() {
  const exists = await checkTableExists('audit');
  if (!exists) {
    throw new Error('audit 表不存在，无法迁移');
  }

  const hasContent = await checkColumnExists('audit', 'content');
  if (!hasContent) {
    throw new Error('audit.content 字段不存在，无法迁移认证数据（需要从 content 解析）');
  }

  if (!(await checkColumnExists('audit', 'admin_id'))) {
    await pool.execute("ALTER TABLE `audit` ADD COLUMN `admin_id` bigint(20) DEFAULT NULL COMMENT '审核人ID（管理员ID）' AFTER `id`");
  }

  if (!(await checkColumnExists('audit', 'target_id'))) {
    await pool.execute("ALTER TABLE `audit` ADD COLUMN `target_id` bigint(20) NOT NULL COMMENT '目标ID：根据type不同，对应用户ID、笔记ID或评论ID' AFTER `type`");
  }

  if (!(await checkColumnExists('audit', 'remark'))) {
    await pool.execute("ALTER TABLE `audit` ADD COLUMN `remark` text DEFAULT NULL COMMENT '审核备注' AFTER `content`");
  }

  const hasUserId = await checkColumnExists('audit', 'user_id');
  if (hasUserId) {
    try {
      await pool.execute(
        "UPDATE `audit` SET `target_id` = `user_id` WHERE (`target_id` = 0 OR `target_id` IS NULL) AND `user_id` IS NOT NULL"
      );
    } catch (e) {
      console.error('将 user_id 迁移到 target_id 失败:', e.message);
    }

    try {
      if (await checkIndexExists('audit', 'idx_user_id')) {
        await pool.execute('ALTER TABLE `audit` DROP KEY `idx_user_id`');
      }
    } catch (e) {
      console.error('删除 idx_user_id 索引失败:', e.message);
    }

    try {
      await pool.execute('ALTER TABLE `audit` DROP COLUMN `user_id`');
    } catch (e) {
      console.error('删除 user_id 字段失败:', e.message);
    }
  }

  try {
    if (!(await checkIndexExists('audit', 'idx_admin_id'))) {
      await pool.execute('ALTER TABLE `audit` ADD KEY `idx_admin_id` (`admin_id`)');
    }
    if (!(await checkIndexExists('audit', 'idx_target_id'))) {
      await pool.execute('ALTER TABLE `audit` ADD KEY `idx_target_id` (`target_id`)');
    }
    if (!(await checkIndexExists('audit', 'idx_type_target'))) {
      await pool.execute('ALTER TABLE `audit` ADD KEY `idx_type_target` (`type`, `target_id`)');
    }
  } catch (e) {
    console.error('补齐 audit 索引失败:', e.message);
  }

  try {
    const fkExists = await checkForeignKeyExists('audit', 'audit_ibfk_1');
    if (!fkExists) {
      await pool.execute(
        'ALTER TABLE `audit` ADD CONSTRAINT `audit_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`id`) ON DELETE SET NULL'
      );
    }
  } catch (e) {
    console.error('补齐 audit 外键失败:', e.message);
  }
}

async function ensureUserVerificationTableExists() {
  const exists = await checkTableExists('user_verification');
  if (exists) return;

  const sql = `
      CREATE TABLE IF NOT EXISTS \`user_verification\` (
        \`id\` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
        \`user_id\` bigint(20) NOT NULL COMMENT '用户ID',
        \`type\` tinyint(4) NOT NULL COMMENT '认证类型：1=官方认证 2=个人认证',
        \`status\` tinyint(4) DEFAULT 0 COMMENT '认证状态：0=待审核 1=已通过 2=已拒绝',
        \`real_name\` varchar(200) NOT NULL COMMENT '真实姓名/机构名称',
        \`id_card\` varchar(18) NOT NULL COMMENT '身份证号/信用代码',
        \`contact_name\` varchar(50) DEFAULT NULL COMMENT '联系人姓名',
        \`contact_phone\` varchar(20) DEFAULT NULL COMMENT '联系电话',
        \`title\` varchar(100) DEFAULT NULL COMMENT '认证称号',
        \`description\` text DEFAULT NULL COMMENT '认证理由',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_user_id\` (\`user_id\`),
        KEY \`idx_type\` (\`type\`),
        KEY \`idx_status\` (\`status\`),
        CONSTRAINT \`user_verification_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户认证表';
    `;

  await pool.execute(sql);
  console.log('✓ user_verification 表创建成功');
}

/**
 * HTML实体解码（仅覆盖常见实体，避免引入额外依赖）
 * @param {string} str
 * @returns {string}
 */
function decodeHtmlEntities(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'");
}

/**
 * 去掉HTML标签，并做基础清洗
 * @param {string} html
 * @returns {string}
 */
function stripHtml(html) {
  if (html == null) return '';
  const text = String(html)
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*p\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ');
  return decodeHtmlEntities(text)
    .replace(/\s+/g, ' ')
    .trim();
}

function tableHtmlToLines(html) {
  if (html == null) return [];
  const text = decodeHtmlEntities(String(html))
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*(td|th)\s*>/gi, '\n')
    .replace(/<\s*\/\s*tr\s*>/gi, '\n')
    .replace(/<\s*\/\s*p\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  return text
    .split('\n')
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/**
 * 从HTML表格中提取字段值
 * @param {string} html - HTML内容
 * @param {string} fieldName - 字段名称
 * @returns {string|null} - 字段值
 */
function extractField(html, fieldName) {
  if (!html || !fieldName) return null;

  // 兼容 <td>/<th>，并允许字段名前后存在空白/换行/&nbsp; 等
  const escaped = String(fieldName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const labelPattern = `(?:${escaped})`;
  const cell = '(?:td|th)';

  const regex = new RegExp(
    `<${cell}[^>]*>\\s*(?:&nbsp;\\s*)*${labelPattern}(?:\\s*&nbsp;)*\\s*<\\/${cell}>\\s*<${cell}[^>]*>([\\s\\S]*?)<\\/${cell}>`,
    'i'
  );

  const match = String(html).match(regex);
  if (match) {
    const value = stripHtml(match[1]);
    return value || null;
  }

  // fallback：把表格转为行文本，按“字段名下一行是值”提取
  const lines = tableHtmlToLines(html);
  const label = stripHtml(fieldName);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === label) {
      return lines[i + 1] || null;
    }
  }

  return null;
}

/**
 * 解析个人认证HTML内容
 * @param {string} content - HTML内容
 * @returns {Object} - 认证信息
 */
function parsePersonalVerification(content) {
  return {
    real_name: extractField(content, '真实姓名'),
    id_card: extractField(content, '身份证号'),
    title: extractField(content, '职业/身份'),
    description: extractField(content, '认证理由')
  };
}

/**
 * 解析官方认证HTML内容
 * @param {string} content - HTML内容
 * @returns {Object} - 认证信息
 */
function parseOfficialVerification(content) {
  return {
    real_name: extractField(content, '机构/企业名称'),
    id_card: extractField(content, '统一社会信用代码'),
    contact_name: extractField(content, '联系人姓名'),
    contact_phone: extractField(content, '联系电话'),
    title: extractField(content, '机构/企业名称'),
    description: extractField(content, '认证理由')
  };
}

function detectVerificationKindByContent(content) {
  const raw = String(content || '');
  if (/个人认证申请/.test(raw) || /真实姓名/.test(raw) || /身份证号/.test(raw) || /职业\s*\/\s*身份/.test(raw)) {
    return 'personal';
  }
  if (/官方认证申请/.test(raw) || /机构\s*\/\s*企业名称/.test(raw) || /统一社会信用代码/.test(raw) || /联系人姓名/.test(raw)) {
    return 'official';
  }
  return null;
}

async function migrate() {
  try {
    console.log('========================================');
    console.log('⚠️  数据迁移工具 - 重要提示');
    console.log('========================================');
    console.log('1. 请确保在执行前已备份数据库');
    console.log('2. 此操作将从audit表迁移数据到user_verification表');
    console.log('3. 已存在的认证记录将被跳过');
    console.log('\n按回车键开始迁移，或按 Ctrl+C 取消...');
    
    // 等待用户确认
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('\n开始执行数据迁移...');
    console.log('========================================');

    console.log('检查 audit 表结构是否为可迁移状态...');
    await ensureAuditTableUpToDate();

    console.log('检查 user_verification 表是否存在...');
    await ensureUserVerificationTableExists();
    
    console.log('正在查询审核表中的认证记录...');
    const [auditRecords] = await pool.execute(
      'SELECT id, type, target_id, content, status, created_at, audit_time FROM audit WHERE type IN (1, 2)'
    );

    console.log(`找到 ${auditRecords.length} 条认证记录`);

    if (auditRecords.length === 0) {
      console.log('没有需要迁移的记录');
      return;
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const record of auditRecords) {
      const { id, type, target_id, content, status, created_at, audit_time } = record;

      if (!content) {
        console.log(`记录 ${id} content 为空，无法解析，跳过`);
        errorCount++;
        continue;
      }

      const kind = detectVerificationKindByContent(content);
      if (!kind) {
        console.log(`记录 ${id} 无法从 content 判断认证类型 (audit.type=${type})，跳过`);
        errorCount++;
        continue;
      }

      // user_verification.type: 1=官方认证 2=个人认证
      const verificationType = kind === 'personal' ? 2 : 1;

      // 检查user_verification表中是否已存在该用户的记录
      const [existing] = await pool.execute(
        'SELECT id FROM user_verification WHERE user_id = ?',
        [target_id.toString()]
      );

      if (existing.length > 0) {
        console.log(`用户 ${target_id} 已有认证记录，跳过`);
        skipCount++;
        continue;
      }

      // 解析HTML内容
      let verificationData;
      if (kind === 'personal') verificationData = parsePersonalVerification(content);
      if (kind === 'official') verificationData = parseOfficialVerification(content);

      // 验证必要字段
      if (!verificationData.real_name || !verificationData.id_card) {
        console.log(`记录 ${id} 缺少必要字段，跳过`);
        console.log(`  解析结果: ${JSON.stringify(verificationData)}`);
        errorCount++;
        continue;
      }

      // 插入user_verification表
      try {
        await pool.execute(
          `INSERT INTO user_verification 
           (user_id, type, status, real_name, id_card, contact_name, contact_phone, title, description, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            target_id.toString(),
            verificationType,
            status,
            verificationData.real_name,
            verificationData.id_card,
            verificationData.contact_name || null,
            verificationData.contact_phone || null,
            verificationData.title || null,
            verificationData.description || null,
            created_at
          ]
        );

        console.log(`用户 ${target_id} 认证记录迁移成功 (audit.type=${type}, kind=${kind}, verification.type=${verificationType}, status=${status})`);
        successCount++;
      } catch (insertError) {
        console.error(`插入用户 ${target_id} 认证记录失败: ${insertError.message}`);
        errorCount++;
      }
    }

    console.log('\n迁移完成！');
    console.log(`成功: ${successCount} 条`);
    console.log(`跳过: ${skipCount} 条`);
    console.log(`失败: ${errorCount} 条`);
    console.log('\n========================================');
    console.log('迁移任务已完成');
    
    // 询问是否删除audit表中的content字段
    console.log('\n========================================');
    console.log('清理选项');
    console.log('========================================');
    console.log('迁移统计信息:');
    console.log(`- 成功迁移: ${successCount} 条记录`);
    console.log(`- 跳过迁移: ${skipCount} 条记录`);
    console.log(`- 迁移失败: ${errorCount} 条记录`);
    console.log('\n是否删除audit表中的content字段？');
    console.log('(content字段包含HTML格式的认证信息，迁移后不再需要)');
    console.log('⚠️  重要提示：删除字段操作不可撤销，请确保已备份数据库！');
    console.log('  此操作将永久删除audit表中的content字段，删除后无法恢复');
    console.log('\n按 Y 键删除，按其他键跳过...');
    
    // 等待用户确认
    const deleteContent = await new Promise(resolve => {
      process.stdin.once('data', (data) => {
        const input = data.toString().trim().toLowerCase();
        resolve(input === 'y' || input === 'yes');
      });
    });
    
    if (deleteContent) {
      try {
        console.log('\n正在删除audit表中的content字段...');
        // 注意：删除字段需要谨慎
        const contentExists = await checkColumnExists('audit', 'content');
        if (!contentExists) {
          console.log('⚠️  audit.content 字段不存在，跳过删除');
        } else {
          await pool.execute('ALTER TABLE audit DROP COLUMN content');
          console.log('✅ 删除content字段成功');
        }
      } catch (deleteError) {
        console.error('删除content字段失败:', deleteError.message);
      }
    } else {
      console.log('\n跳过删除content字段');
    }
    
    // 等待用户按回车退出
    console.log('\n按回车键退出...');
    process.stdin.once('data', () => {
      pool.end().finally(() => process.exit(0));
    });

  } catch (error) {
    console.error('迁移失败:', error.message);
    console.log('\n按回车键退出...');
    process.stdin.once('data', () => {
      pool.end().finally(() => process.exit(1));
    });
  }
}

migrate();
