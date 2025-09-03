//该文件用于更新数据库中来自栗次元api的图片链接
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const https = require('https');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'xiaoshiliu',
  charset: 'utf8mb4'
};

// 图片更新器
class ImageUpdater {
  constructor() {
    // 初始化时不读取文件，而是先更新链接文件
    this.newAvatarLinks = [];
    this.newImageLinks = [];
  }

  // 从文件加载链接
  loadLinksFromFile(filename) {
    try {
      const filePath = path.join(__dirname, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      return content.trim().split('\n').filter(link => link.trim());
    } catch (error) {
      console.error(`读取文件 ${filename} 失败:`, error);
      return [];
    }
  }

  // 获取随机图片URL
  getRandomImageUrl(imageType = 'post') {
    const links = imageType === 'avatar' ? this.newAvatarLinks : this.newImageLinks;
    if (links.length === 0) {
      console.warn(`没有可用的${imageType === 'avatar' ? '头像' : '帖子'}图片链接`);
      return null;
    }
    const randomIndex = Math.floor(Math.random() * links.length);
    return links[randomIndex];
  }

  // 检查URL是否为tc.alcy.cc图床的图片
  isTcAlcyImage(url) {
    return url && typeof url === 'string' && url.includes('tc.alcy.cc');
  }

  // 更新用户头像
  async updateUserAvatars(connection) {
    console.log('开始更新用户头像...');

    try {
      // 查询所有使用tc.alcy.cc图床的用户头像
      const [users] = await connection.execute(
        'SELECT id, avatar FROM users WHERE avatar LIKE "%tc.alcy.cc%"'
      );

      console.log(`找到 ${users.length} 个需要更新的用户头像`);

      let updatedCount = 0;
      for (const user of users) {
        if (this.isTcAlcyImage(user.avatar)) {
          const newAvatarUrl = this.getRandomImageUrl('avatar');
          if (newAvatarUrl) {
            await connection.execute(
              'UPDATE users SET avatar = ? WHERE id = ?',
              [newAvatarUrl, user.id]
            );
            updatedCount++;
          }
        }
      }

      console.log(`用户头像更新完成，共更新 ${updatedCount} 个头像`);
    } catch (error) {
      console.error('❌ 更新用户头像失败:', error);
      throw error;
    }
  }

  // 更新帖子图片
  async updatePostImages(connection) {
    console.log('开始更新帖子图片...');

    try {
      // 查询所有使用tc.alcy.cc图床的帖子图片
      const [images] = await connection.execute(
        'SELECT id, image_url FROM post_images WHERE image_url LIKE "%tc.alcy.cc%"'
      );

      console.log(`找到 ${images.length} 个需要更新的帖子图片`);

      let updatedCount = 0;
      for (const image of images) {
        if (this.isTcAlcyImage(image.image_url)) {
          const newImageUrl = this.getRandomImageUrl('post');
          if (newImageUrl) {
            await connection.execute(
              'UPDATE post_images SET image_url = ? WHERE id = ?',
              [newImageUrl, image.id]
            );
            updatedCount++;
          }
        }
      }

      console.log(`帖子图片更新完成，共更新 ${updatedCount} 个图片`);
    } catch (error) {
      console.error('❌ 更新帖子图片失败:', error);
      throw error;
    }
  }

  // 统计更新信息
  async printUpdateStats(connection) {
    console.log('\n更新统计信息:');

    try {
      // 统计用户头像
      const [avatarStats] = await connection.execute(
        'SELECT COUNT(*) as total, SUM(CASE WHEN avatar LIKE "%tc.alcy.cc%" THEN 1 ELSE 0 END) as tc_alcy_count FROM users WHERE avatar IS NOT NULL'
      );

      // 统计帖子图片
      const [imageStats] = await connection.execute(
        'SELECT COUNT(*) as total, SUM(CASE WHEN image_url LIKE "%tc.alcy.cc%" THEN 1 ELSE 0 END) as tc_alcy_count FROM post_images'
      );

      console.log(`用户头像: 总计 ${avatarStats[0].total} 个，其中 ${avatarStats[0].tc_alcy_count} 个来自 tc.alcy.cc`);
      console.log(`帖子图片: 总计 ${imageStats[0].total} 个，其中 ${imageStats[0].tc_alcy_count} 个来自 tc.alcy.cc`);
    } catch (error) {
      console.error('❌ 获取统计信息失败:', error);
    }
  }

  // 从API获取图片链接
  async fetchImageLinks(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const links = data.trim().split('\n').filter(link => link.trim());
            resolve(links);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  // 更新图片链接文件
  async updateImageLinkFiles() {
    try {
      // 清空并获取头像链接
      const avatarLinks = await this.fetchImageLinks('https://t.alcy.cc/tx/?json&quantity=50');
      const avatarFilePath = path.join(__dirname, '../imgLinks/avatar_link.txt');
      fs.writeFileSync(avatarFilePath, avatarLinks.join('\n'), 'utf8');
      // 清空并获取帖子图片链接
      const postLinks1 = await this.fetchImageLinks('https://t.alcy.cc/moemp/?json&quantity=100');
      const postLinks2 = await this.fetchImageLinks('https://t.alcy.cc/mp/?json&quantity=200');
      const allPostLinks = [...postLinks1, ...postLinks2];
      const postFilePath = path.join(__dirname, '../imgLinks/post_img_link.txt');
      fs.writeFileSync(postFilePath, allPostLinks.join('\n'), 'utf8');
      // 更新内存中的链接数组
      this.newAvatarLinks = avatarLinks;
      this.newImageLinks = allPostLinks;
      
      console.log('图片链接文件更新完成\n');
    } catch (error) {
      console.error('❌ 更新图片链接文件失败:', error);
      throw error;
    }
  }

  // 执行更新
  async updateImages() {
    // 首先更新图片链接文件
    await this.updateImageLinkFiles();
    console.log(`可用头像链接: ${this.newAvatarLinks.length} 个`);
    console.log(`可用帖子图片链接: ${this.newImageLinks.length} 个\n`);

    if (this.newAvatarLinks.length === 0 && this.newImageLinks.length === 0) {
      console.error('❌ 没有可用的图片链接，请检查图片链接文件');
      return;
    }

    let connection;
    try {
      // 连接数据库
      connection = await mysql.createConnection(dbConfig);
      console.log('数据库连接成功\n');

      // 显示更新前的统计信息
      console.log('更新前的统计信息:');
      await this.printUpdateStats(connection);
      console.log('');

      // 更新用户头像
      if (this.newAvatarLinks.length > 0) {
        await this.updateUserAvatars(connection);
        console.log('');
      } else {
        console.log('⚠️ 跳过用户头像更新（没有可用的头像链接）\n');
      }

      // 更新帖子图片
      if (this.newImageLinks.length > 0) {
        await this.updatePostImages(connection);
        console.log('');
      } else {
        console.log('⚠️ 跳过帖子图片更新（没有可用的帖子图片链接）\n');
      }

      // 显示更新后的统计信息
      console.log('更新后的统计信息:');
      await this.printUpdateStats(connection);

      console.log('\n图片更新完成！');
    } catch (error) {
      console.error('❌ 更新过程中发生错误:', error);
    } finally {
      if (connection) {
        await connection.end();
        console.log('\n数据库连接已关闭');
      }
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const updater = new ImageUpdater();
  updater.updateImages();
}

module.exports = ImageUpdater;