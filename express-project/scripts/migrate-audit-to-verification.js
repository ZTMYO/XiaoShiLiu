/**
 * 从审核表(audit)迁移认证数据到用户认证表(user_verification)
 * 解析audit表中的content字段（HTML格式），提取认证信息
 */

const { pool } = require('../config/config');

/**
 * 从HTML表格中提取字段值
 * @param {string} html - HTML内容
 * @param {string} fieldName - 字段名称
 * @returns {string|null} - 字段值
 */
function extractField(html, fieldName) {
  const regex = new RegExp(`<td[^>]*>${fieldName}</td>\\s*<td[^>]*>(.*?)</td>`, 'is');
  const match = html.match(regex);
  return match ? match[1].trim() : null;
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
      if (type === 2) {
        verificationData = parsePersonalVerification(content);
      } else if (type === 1) {
        verificationData = parseOfficialVerification(content);
      } else {
        console.log(`未知的认证类型: ${type}，跳过`);
        skipCount++;
        continue;
      }

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
            type,
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

        console.log(`用户 ${target_id} 认证记录迁移成功 (type=${type}, status=${status})`);
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
        await pool.execute('ALTER TABLE audit DROP COLUMN content');
        console.log('✅ 删除content字段成功');
      } catch (deleteError) {
        console.error('删除content字段失败:', deleteError.message);
      }
    } else {
      console.log('\n跳过删除content字段');
    }
    
    // 等待用户按回车退出
    console.log('\n按回车键退出...');
    process.stdin.once('data', () => {
      process.exit(0);
    });

  } catch (error) {
    console.error('迁移失败:', error.message);
    console.log('\n按回车键退出...');
    process.stdin.once('data', () => {
      process.exit(1);
    });
  }
}

migrate();
