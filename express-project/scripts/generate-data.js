const NotificationHelper = require('../utils/notificationHelper');
const config = require('../config/config');
const { pool } = config;
const fs = require('fs');
const path = require('path');


// 模拟数据生成器
class DataGenerator {
  constructor() {
    // 读取图片链接文件
    this.avatarLinks = this.loadLinksFromFile('../imgLinks/avatar_link.txt');
    this.imageLinks = this.loadLinksFromFile('../imgLinks/post_img_link.txt');
    // 使用中文分类名称
    this.categories = [
      '学习', '校园', '情感', '兴趣',
      '生活', '社交', '求助', '观点', '毕业', '职场'
    ];
    // 分类对应的相关内容
    this.categoryData = {
      '学习': {
        name: '学习',
        tags: ['学习', '知识', '技能', '成长', '教程', '笔记', '考试', '读书'],
        titles: [
          '高效学习法分享，让你事半功倍',
          '我的学习笔记整理术，超实用！',
          '从学渣到学霸的逆袭之路',
          '这些学习APP改变了我的人生',
          '期末复习攻略，助你轻松过关',
          '读书笔记分享：《xxx》读后感',
          '英语学习心得，零基础也能学好',
          '考研经验分享，一战上岸秘籍',
          '时间管理技巧，告别拖延症',
          '记忆力训练方法，过目不忘不是梦'
        ],
        contents: [
          '经过一年的摸索，我终于找到了适合自己的学习方法。今天分享给大家，希望能帮助到正在学习路上奋斗的小伙伴们。记住，方法比努力更重要！',
          '整理了我这学期的学习笔记和心得体会，从时间规划到知识梳理，每一个环节都有详细的方法介绍。学习不是死记硬背，而是要找到规律和技巧。',
          '分享一些我在学习过程中发现的宝藏资源和实用工具，这些都是我亲测有效的。希望能帮助大家提高学习效率，早日达成目标！',
          '学习是一个持续的过程，需要不断地调整方法和心态。今天想和大家聊聊我在学习路上的一些感悟和经验，希望能给迷茫中的你一些启发。'
        ]
      },
      '校园': {
        name: '校园',
        tags: ['校园', '大学', '社团', '活动', '青春', '宿舍', '食堂', '图书馆'],
        titles: [
          '大学四年，这些事情一定要做',
          '社团生活记录，遇见更好的自己',
          '校园美食探店，食堂隐藏菜单大公开',
          '宿舍改造大作战，小空间大智慧',
          '图书馆学习vlog，静谧时光最美好',
          '校园春日漫步，樱花飞舞的季节',
          '毕业季倒计时，青春不散场',
          '新生入学指南，学长学姐的贴心提醒',
          '期末考试周日常，熬夜复习的日子',
          '校园恋爱小故事，青涩而美好'
        ],
        contents: [
          '大学时光总是过得特别快，转眼间就要毕业了。回想这四年的校园生活，有太多美好的回忆值得珍藏。今天想和大家分享一些校园生活的点点滴滴。',
          '参加社团是大学生活中最精彩的部分之一，在这里我遇到了志同道合的朋友，学到了很多课堂上学不到的东西。分享一些社团活动的精彩瞬间。',
          '校园里的每一个角落都有着独特的魅力，从梧桐叶飘落的小径到灯火通明的图书馆，每一处风景都承载着青春的记忆。',
          '宿舍是我们在校园里的小家，虽然空间不大，但充满了温馨和欢声笑语。和室友们一起度过的时光，是大学生活中最珍贵的回忆。'
        ]
      },
      '情感': {
        name: '情感',
        tags: ['情感', '心情', '感悟', '治愈', '温暖', '孤独', '成长', '爱情'],
        titles: [
          '深夜emo时刻，写给迷茫的自己',
          '那些治愈人心的温暖瞬间',
          '关于成长，我想说的话',
          '孤独是人生的必修课',
          '爱情里的小确幸与小失落',
          '致敬那个努力生活的自己',
          '人间值得，你也值得被爱',
          '成年人的崩溃都是静悄悄的',
          '愿你眼中有光，心中有爱',
          '那些说不出口的心里话'
        ],
        contents: [
          '最近总是在深夜时分陷入沉思，想起了很多过往的事情。人生就像一场旅行，有高峰也有低谷，重要的是要学会在每一个阶段都找到属于自己的意义。',
          '生活中总有一些瞬间能够温暖人心，可能是陌生人的一个微笑，可能是朋友的一句关怀，也可能是家人的一个拥抱。这些小小的温暖，构成了生活的美好。',
          '成长是一个痛苦而美好的过程，我们在跌跌撞撞中学会了坚强，在失去中懂得了珍惜。每一次的经历都是成长路上的垫脚石。',
          '有时候觉得很孤独，但后来发现孤独也是一种力量。在独处的时光里，我们能够更好地认识自己，倾听内心的声音。'
        ]
      },
      '兴趣': {
        name: '兴趣',
        tags: ['兴趣', '爱好', '收藏', '手工', '创作', '绘画', '音乐', '摄影'],
        titles: [
          '手工DIY教程，零基础也能学会',
          '我的收藏品分享，每一件都有故事',
          '绘画日常记录，用画笔记录生活',
          '摄影技巧分享，拍出大片的秘密',
          '音乐推荐清单，治愈你的耳朵',
          '手账制作教程，记录美好时光',
          '插花艺术入门，让生活更有仪式感',
          '书法练习日记，一笔一划皆修行',
          '烘焙小课堂，甜蜜生活从这里开始',
          '园艺日记，和植物一起成长'
        ],
        contents: [
          '最近迷上了手工制作，发现动手创造的过程特别治愈。今天分享一个简单易学的DIY教程，材料都很容易买到，大家可以在家试试看。',
          '每一件收藏品背后都有一个故事，有些是旅行时的纪念，有些是朋友的礼物，有些是偶然发现的宝贝。今天想和大家分享我的收藏故事。',
          '用画笔记录生活中的美好瞬间，是我最喜欢的事情之一。不需要多么高超的技巧，只要用心去观察和感受，每一幅画都是独一无二的。',
          '摄影让我学会了用不同的角度去看世界，每一次按下快门都是对美好瞬间的定格。分享一些我在摄影路上的心得和技巧。'
        ]
      },
      '生活': {
        name: '生活',
        tags: ['生活', '日常', '美食', '旅行', '家居', '穿搭', '护肤', '健康'],
        titles: [
          '一人食的精致生活，简单也很美',
          '周末宅家指南，享受慢时光',
          '旅行vlog分享，世界那么大要去看看',
          '家居改造日记，打造温馨小窝',
          '今日穿搭分享，做自己的时尚博主',
          '护肤心得分享，养出好皮肤的秘密',
          '健康生活小贴士，从细节开始改变',
          '美食制作教程，治愈系料理时光',
          '断舍离实践记录，极简生活更自由',
          '早起挑战日记，美好从清晨开始'
        ],
        contents: [
          '生活不需要多么轰轰烈烈，平凡的日常里也藏着小确幸。今天想和大家分享我的日常生活，希望能给大家带来一些生活的灵感和温暖。',
          '最近爱上了慢生活的节奏，不再追求忙碌，而是学会享受当下的每一个瞬间。分享一些让生活变得更美好的小习惯和小技巧。',
          '旅行是我认识世界的方式，每一次出行都会有新的发现和感悟。今天分享我最近的旅行经历，希望能激发大家对世界的好奇心。',
          '家是心灵的港湾，一个温馨舒适的居住环境能够让人感到放松和愉悦。分享一些家居布置的心得，让家变得更有温度。'
        ]
      },
      '社交': {
        name: '社交',
        tags: ['社交', '朋友', '聚会', '交流', '分享', '人际关系', '沟通'],
        titles: [
          '社交技巧分享，让你成为聚会焦点',
          '朋友聚会vlog，快乐时光要分享',
          '如何维护长久的友谊关系',
          '内向者的社交指南，慢热也很棒',
          '网络交友心得，线上线下都要真诚',
          '聚会游戏推荐，活跃气氛必备',
          '人际沟通的艺术，说话也是门学问',
          '异地友谊维护指南，距离不是问题',
          '职场社交礼仪，新人必看攻略',
          '如何结交志同道合的朋友'
        ],
        contents: [
          '社交是人生中重要的一课，良好的人际关系能够让我们的生活更加丰富多彩。今天想和大家分享一些社交方面的心得和技巧。',
          '和朋友们聚在一起的时光总是特别珍贵，那些欢声笑语和温暖的陪伴，是生活中最美好的回忆。分享一些和朋友相处的快乐时光。',
          '真正的友谊需要用心经营和维护，不是简单的点赞之交，而是能够在彼此需要的时候给予支持和陪伴的深厚情谊。',
          '每个人都有自己的社交方式，内向的人也有自己的魅力和优势。重要的是要找到适合自己的社交节奏，做真实的自己。'
        ]
      },
      '求助': {
        name: '求助',
        tags: ['帮助', '求助', '解答', '支持', '互助', '经验', '建议'],
        titles: [
          '求助：关于xxx的问题，求大神指点',
          '经验分享：我是如何解决xxx问题的',
          '新手求助：第一次遇到这种情况',
          '互助交流：大家都是怎么处理的？',
          '问题解答：详细教程来了',
          '踩坑经验分享，避免重复犯错',
          '资源分享：这些网站/工具超好用',
          '答疑解惑：常见问题汇总',
          '经验总结：从失败中学到的教训',
          '互帮互助：一起解决难题'
        ],
        contents: [
          '最近遇到了一个棘手的问题，自己研究了很久还是没有找到好的解决方案。希望有经验的朋友能够给一些建议和指导，非常感谢！',
          '之前也遇到过类似的问题，经过一番摸索终于找到了解决方法。今天分享给大家，希望能帮助到有同样困扰的朋友。',
          '在解决问题的过程中踩了不少坑，也学到了很多东西。把这些经验总结出来分享给大家，希望大家能够避免重复犯错。',
          '互帮互助是社区最美好的地方，每个人都有自己的专长和经验。今天想和大家交流一下关于xxx的看法和经验。'
        ]
      },
      '观点': {
        name: '观点',
        tags: ['观点', '看法', '讨论', '思考', '见解', '评论', '分析'],
        titles: [
          '关于xxx现象的一些思考',
          '我对xxx问题的看法和建议',
          '深度分析：xxx背后的原因',
          '观点碰撞：不同角度看xxx',
          '理性讨论：如何看待xxx',
          '个人见解：xxx的利与弊',
          '思辨时刻：xxx真的好吗？',
          '多元视角：xxx的不同解读',
          '批判思维：质疑xxx的合理性',
          '观点分享：我为什么支持/反对xxx'
        ],
        contents: [
          '最近关于xxx的讨论很热烈，我也想分享一下自己的观点和看法。每个人的经历和背景不同，对同一件事情可能会有不同的理解。',
          '看到大家对xxx问题的讨论，我觉得这是一个很值得深入思考的话题。今天想从几个不同的角度来分析这个问题。',
          '理性讨论是社会进步的重要推动力，不同观点的碰撞能够帮助我们更全面地认识问题。希望大家能够以开放的心态参与讨论。',
          '每个人都有表达观点的权利，但同时也要尊重他人的不同看法。在讨论中保持理性和包容，才能真正促进思想的交流。'
        ]
      },
      '毕业': {
        name: '毕业',
        tags: ['毕业', '告别', '回忆', '未来', '成长', '感恩', '青春'],
        titles: [
          '毕业倒计时，青春不散场',
          '致即将逝去的大学时光',
          '毕业感言：感谢遇见，感谢成长',
          '告别母校，带着梦想前行',
          '毕业旅行vlog，最后的狂欢',
          '学士服写真，定格青春瞬间',
          '毕业典礼现场，泪水与笑容并存',
          '致亲爱的室友们，友谊长存',
          '毕业论文答辩记录，终于结束了',
          '未来可期，愿我们都能发光发热'
        ],
        contents: [
          '时间过得真快，转眼间就要毕业了。回想这几年的大学时光，有太多美好的回忆值得珍藏。感谢所有陪伴我走过这段路程的人。',
          '毕业不是结束，而是新的开始。虽然即将告别熟悉的校园，但我们带走的不仅是知识，更是成长的经历和珍贵的友谊。',
          '在这个特殊的时刻，想对所有帮助过我的老师、同学和朋友们说声谢谢。是你们让我的大学生活如此精彩和充实。',
          '即将踏出校门，心情既兴奋又忐忑。未来充满了未知，但我相信只要保持初心，勇敢追梦，一切都会是最好的安排。'
        ]
      },
      '职场': {
        name: '职场',
        tags: ['职场', '工作', '求职', '面试', '职业', '实习', '升职', '跳槽'],
        titles: [
          '求职经验分享，从简历到面试全攻略',
          '职场新人生存指南，避坑必看',
          '实习日记：初入职场的酸甜苦辣',
          '面试技巧总结，助你成功拿offer',
          '职场沟通艺术，如何与同事相处',
          '工作感悟：在职场中成长的点点滴滴',
          '跳槽思考：什么时候该换工作？',
          '职业规划分享，如何找到适合的方向',
          '加班文化思考，工作与生活的平衡',
          '职场穿搭指南，形象管理很重要'
        ],
        contents: [
          '刚刚结束了一轮求职，想和大家分享一些经验和心得。求职是一个漫长而充满挑战的过程，但只要做好充分的准备，相信大家都能找到心仪的工作。',
          '初入职场的这段时间，学到了很多在学校里学不到的东西。职场生活和校园生活有很大的不同，需要我们不断地适应和成长。',
          '工作中遇到了很多挑战，也收获了很多成长。每一次的困难都是学习的机会，每一次的成功都是努力的回报。',
          '职场是一个复杂的环境，需要我们学会处理各种人际关系和工作问题。保持学习的心态，不断提升自己的能力，是在职场中立足的关键。'
        ]
      }
    };

    this.usernames = ['云鲸漫游', '芋圆小甜饼', '晚风扑满怀', '雾岛听风', '星子打烊了', '春日部干事', '奶油小方', '山月记', '半糖去冰', '枕星河入梦', '树影摇窗', '汽水冒泡', '碎碎 念小记', '盐系小野猫', '贩卖日落', '莓烦恼', '焦糖玛奇朵', '雨停了就走', '北岛迷途', '小桃汽泡', '青柠七分甜', '雾散 见山', '夏夜晚风', '一口吃掉月亮', '林间小筑', '念安', '奶芙泡芙', '星河欲转', '南风知我意', '小梨涡', '橘色晚霞', '薄荷微光', '山茶花读不懂白玫瑰', '月落星沉', '小熊软糖', '岛与幕歌', '风拂过裙摆', '拾光者', '芋泥啵啵', '雾漫南山', '半窗疏影', '软风沉醉', '甜度超标', '落日收藏家', '碎星入怀', '清粥配小菜', '云深不知处', '晚风寄信', '青衫仗剑', '小春日和'];
    this.locations = ['北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '西安', '南京', '武汉', '天津', '苏州', '长沙', '郑州', '青岛', '大连', '厦门', '福州', '昆明', '贵阳', '南宁', '海口', '三亚', '拉萨', '乌鲁木齐', '银川', '西宁', '兰州', '呼和浩特', '哈尔滨', '长春', '沈阳', '石家庄', '太原', '济南', '合肥', '南昌', '温州', '宁波', '无锡', '常州', '徐州', '扬州', '镇江', '泰州', '盐城', '淮安', '连云港', '宿迁', '嘉兴'];
  }

  //生成随机图片URL（用于笔记图片）
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

  generateRandomImageUrl() {
    const randomIndex = Math.floor(Math.random() * this.imageLinks.length);
    return this.imageLinks[randomIndex];
  }

  //生成随机头像URL
  generateRandomAvatarUrl() {
    const randomIndex = Math.floor(Math.random() * this.avatarLinks.length);
    return this.avatarLinks[randomIndex];
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 清空数据库表数据
  async clearTables(connection) {
    console.log(' 清空现有数据...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    const tables = [
      'user_sessions', 'notifications', 'comments', 'collections',
      'likes', 'post_tags', 'follows', 'post_images', 'posts',
      'tags', 'users', 'admin', 'categories', 'audit', 'post_videos',
      'admin_sessions', 'user_ban'
    ];

    for (const table of tables) {
      try {
        await connection.execute(`TRUNCATE TABLE ${table}`);
        console.log(`     已清空 ${table} 表`);
      } catch (error) {
        if (!error.message.includes("doesn't exist")) {
          console.warn(`   ⚠️ 清空 ${table} 表失败: ${error.message}`);
        }
      }
    }

    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('数据清空完成');
  }

  //生成管理员数据
  generateAdmins() {
    return [
      { username: 'admin', password: '123456' },
      { username: 'admin2', password: '123456' },
      { username: 'admin3', password: '123456' }
    ];
  }

  // 插入管理员数据（密码使用SHA2哈希加密）
  async insertAdmins(connection, admins) {
    for (const admin of admins) {
      await connection.execute(
        'INSERT INTO admin (username, password) VALUES (?, SHA2(?, 256))',
        [admin.username, admin.password]
      );
    }
    console.log(`     已插入 ${admins.length} 个管理员账户`);
  }

  // 插入用户数据（密码使用SHA2哈希加密）
  async insertUsers(connection, users) {
    for (const user of users) {
      const result = await connection.execute(
        'INSERT INTO users (user_id, password, nickname, avatar, bio, location, follow_count, fans_count, like_count, is_active, last_login_at, email, gender, zodiac_sign, mbti, education, major, interests) VALUES (?, SHA2(?, 256), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user.user_id, user.password, user.nickname, user.avatar, user.bio, user.location, 0, 0, 0, user.is_active, user.last_login_at, user.email, user.gender, user.zodiac_sign, user.mbti, user.education, user.major, user.interests]
      );
      // 更新用户对象的id字段为数据库自增id
      user.id = result[0].insertId;
      await this.delay(50);
    }
    console.log(`     已插入 ${users.length} 个用户`);
  }

  // 插入标签数据
  async insertTags(connection, tags) {
    for (const tag of tags) {
      await connection.execute(
        'INSERT INTO tags (name, use_count) VALUES (?, ?)',
        [tag.name, 0]
      );
    }
    console.log(`     已插入 ${tags.length} 个标签`);
  }

  // 插入笔记数据
  async insertPosts(connection, posts) {
    for (const post of posts) {
      const [result] = await connection.execute(
        'INSERT INTO posts (user_id, title, content, category_id, type, status, copyright, view_count, like_count, collect_count, comment_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [post.user_id, post.title, post.content, post.category_id, 1, post.status, post.copyright, post.view_count, 0, 0, 0]
      );
      const postId = result.insertId;
      
      // 草稿不创建审核记录
      if (post.status !== 1) {
        await connection.execute(
          'INSERT INTO audit (type, target_id, status) VALUES (?, ?, ?)',
          [3, postId, 0]
        );
      }
      
      await this.delay(50);
    }
    console.log(`     已插入 ${posts.length} 个笔记`);
  }

  // 插入笔记图片数据
  async insertPostImages(connection, postImages) {
    for (const image of postImages) {
      await connection.execute(
        'INSERT INTO post_images (post_id, image_url) VALUES (?, ?)',
        [image.post_id, image.image_url]
      );
      await this.delay(30);
    }
    console.log(`     已插入 ${postImages.length} 个笔记图片`);
  }



  // 插入关注关系数据并更新用户统计
  async insertFollowsWithStats(connection, follows, userCount) {
    const userFollowStats = {}; // 用户关注统计
    const userFansStats = {}; // 用户粉丝统计

    // 初始化统计
    for (let i = 1; i <= userCount; i++) {
      userFollowStats[i] = 0;
      userFansStats[i] = 0;
    }

    // 插入关注关系并统计
    for (const follow of follows) {
      await connection.execute(
        'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
        [follow.follower_id, follow.following_id]
      );

      // 更新统计
      userFollowStats[follow.follower_id]++;
      userFansStats[follow.following_id]++;
    }

    // 更新用户关注和粉丝数
    for (let userId = 1; userId <= userCount; userId++) {
      await connection.execute(
        'UPDATE users SET follow_count = ?, fans_count = ? WHERE id = ?',
        [userFollowStats[userId], userFansStats[userId], userId]
      );
    }

    console.log(`     已插入 ${follows.length} 个关注关系并更新用户统计`);
  }

  //生成随机用户数据
  generateUsers(count = 50) {
    const users = [];
    const bios = [
      '热爱生活，记录美好瞬间 ✨',
      '一个爱笑的女孩子，分享日常小确幸 😊',
      '学生党 | 爱学习爱生活 📚',
      '摄影爱好者 | 用镜头记录世界 📷',
      '美食探索者 | 吃遍天下美食 🍜',
      '旅行达人 | 世界那么大，我想去看看 ✈️',
      '手工爱好者 | 用双手创造美好 🎨',
      '读书人 | 书中自有黄金屋 📖',
      '音乐发烧友 | 生活需要BGM 🎵',
      '健身小达人 | 自律给我自由 💪',
      '宠物奴才 | 我家主子最可爱 🐱',
      '植物妈妈 | 和绿植一起成长 🌱',
      '咖啡控 | 没有咖啡的日子不完整 ☕',
      '电影迷 | 光影世界的探索者 🎬',
      '游戏玩家 | 虚拟世界的冒险家 🎮',
      '二次元少女 | 永远18岁 🌸',
      '古风爱好者 | 愿得一人心，白首不相离 🏮',
      '科技控 | 追求极客精神 💻',
      '理财小白 | 努力实现财务自由 💰',
      '创业者 | 梦想还是要有的 🚀',
      '设计师 | 用设计改变世界 🎨',
      '程序员 | 代码改变世界 👨‍💻',
      '教师 | 传道授业解惑 👩‍🏫',
      '医学生 | 救死扶伤是使命 👩‍⚕️',
      '法学生 | 正义永不缺席 ⚖️',
      '心理学爱好者 | 探索内心世界 🧠',
      '环保主义者 | 保护地球从我做起 🌍',
      '极简主义者 | 少即是多 ✨',
      '收纳达人 | 整理改变生活 📦',
      '烘焙爱好者 | 甜蜜生活的创造者 🧁',
      '瑜伽练习者 | 身心合一的修行 🧘‍',
      '跑步爱好者 | 奔跑是最好的修行 🏃‍♀️',
      '书法爱好者 | 一笔一划皆修行 ✍️',
      '茶艺爱好者 | 品茶品人生 🍵',
      '花艺师 | 用花朵装点生活 💐',
      '插画师 | 用画笔诉说故事 🖌️',
      '自由撰稿人 | 文字是我的武器 ✒️',
      '翻译工作者 | 语言的桥梁 🌐',
      '志愿者 | 用爱心温暖世界 ❤️',
      '独立思考者 | 保持理性与批判 🤔',
      '终身学习者 | 活到老学到老 📚',
      '时间管理达人 | 效率就是生命 ⏰',
      '断舍离践行者 | 简单生活更自由 🕊️',
      '正能量传播者 | 做自己的太阳 ☀️',
      '梦想追逐者 | 永远年轻，永远热泪盈眶 🌟',
      '生活美学家 | 把日子过成诗 🌺',
      '情感博主 | 用文字治愈心灵 💝',
      '知识分享者 | 分享让知识更有价值 🎓',
      '温柔的人 | 愿世界温柔以待 🤗',
      '努力生活的普通人 | 平凡而不平庸 🌈'
    ];

    // 6大信息的选项池
    const genders = ['male', 'female'];
    const zodiacSigns = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
    const mbtiTypes = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
    const educations = ['高中', '大专', '本科', '硕士', '博士'];
    const majors = ['计算机科学', '软件工程', '电子信息', '机械工程', '土木工程', '建筑学', '经济学', '金融学', '会计学', '市场营销', '工商管理', '人力资源', '法学', '新闻传播', '汉语言文学', '英语', '心理学', '教育学', '医学', '护理学', '药学', '生物学', '化学', '物理学', '数学', '艺术设计', '音乐', '美术', '体育'];
    const interestOptions = ['阅读', '电影', '音乐', '旅行', '摄影', '美食', '健身', '游戏', '绘画', '书法', '舞蹈', '唱歌', '乐器', '编程', '设计', '写作', '手工', '园艺', '宠物', '收藏', '运动', '瑜伽', '冥想', '烹饪', '烘焙', '茶艺', '咖啡', '红酒', '时尚', '化妆', '护肤', '购物', '投资', '创业', '志愿服务', '环保', '公益'];

    for (let i = 0; i < count; i++) {
      // 随机生成兴趣（2-5个）
      const userInterests = [];
      const interestCount = Math.floor(Math.random() * 4) + 2; // 2-5个兴趣
      const shuffledInterests = [...interestOptions].sort(() => 0.5 - Math.random());
      for (let j = 0; j < interestCount; j++) {
        userInterests.push(shuffledInterests[j]);
      }

      const user = {
        user_id: `user${String(i + 1).padStart(3, '0')}`, // 小石榴号，字符串格式
        password: '123456', // 使用明文密码
        nickname: this.usernames[i], // 按顺序使用usernames数组，不重复
        avatar: this.generateRandomAvatarUrl(),
        bio: bios[Math.floor(Math.random() * bios.length)],
        location: this.locations[i], // 按顺序使用locations数组，不重复
        follow_count: Math.floor(Math.random() * 500),
        fans_count: Math.floor(Math.random() * 1000),
        like_count: Math.floor(Math.random() * 5000),
        is_active: 1, // 添加is_active字段
        last_login_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // 添加last_login_at字段（随机30天内）
        // 添加email字段，使用user_id和随机域名组合
        email: `user${String(i + 1).padStart(3, '0')}@example.com`,
        // 6大信息字段（70%概率填写，30%概率为空）
        gender: Math.random() > 0.3 ? genders[Math.floor(Math.random() * genders.length)] : null,
        zodiac_sign: Math.random() > 0.3 ? zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)] : null,
        mbti: Math.random() > 0.3 ? mbtiTypes[Math.floor(Math.random() * mbtiTypes.length)] : null,
        education: Math.random() > 0.3 ? educations[Math.floor(Math.random() * educations.length)] : null,
        major: Math.random() > 0.3 ? majors[Math.floor(Math.random() * majors.length)] : null,
        interests: Math.random() > 0.3 ? JSON.stringify(userInterests) : null,
        verified: 0
      };
      users.push(user);
    }
    return users;
  }

  //生成随机标签数据
  generateTags() {
    const allTags = [];
    Object.values(this.categoryData).forEach(category => {
      allTags.push(...category.tags);
    });

    // 去重并生成标签数据
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags.map(tag => ({
      name: tag,
      use_count: Math.floor(Math.random() * 200) + 10
    }));
  }

  //生成随机笔记数据
  generatePosts(userCount, count = 200) {
    const posts = [];
    for (let i = 0; i < count; i++) {
      const categoryIndex = Math.floor(Math.random() * this.categories.length);
      const category = this.categories[categoryIndex];
      const categoryInfo = this.categoryData[category];

      const post = {
        user_id: Math.floor(Math.random() * userCount) + 1,
        title: categoryInfo.titles[Math.floor(Math.random() * categoryInfo.titles.length)],
        content: categoryInfo.contents[Math.floor(Math.random() * categoryInfo.contents.length)],
        category_id: categoryIndex + 1, // 使用分类ID（从1开始）
        status: 0, // 默认状态为审核提供
        copyright: Math.random() > 0.3 ? 0 : 1, // 70%原创，30%转载
        view_count: Math.floor(Math.random() * 10000),
        like_count: Math.floor(Math.random() * 500),
        collect_count: Math.floor(Math.random() * 100),
        comment_count: Math.floor(Math.random() * 50)
      };
      posts.push(post);
    }
    return posts;
  }

  //生成笔记图片数据
  generatePostImages(postCount, maxImagesPerPost = 5) {
    const images = [];
    for (let postId = 1; postId <= postCount; postId++) {
      const imageCount = Math.floor(Math.random() * maxImagesPerPost) + 1;
      for (let i = 0; i < imageCount; i++) {
        images.push({
          post_id: postId,
          image_url: this.generateRandomImageUrl()
        });
      }
    }
    return images;
  }

  //生成关注关系数据
  generateFollows(userCount, count = 300) {
    const follows = [];
    const used = new Set();

    for (let i = 0; i < count; i++) {
      let follower_id, following_id;
      do {
        follower_id = Math.floor(Math.random() * userCount) + 1;
        following_id = Math.floor(Math.random() * userCount) + 1;
      } while (follower_id === following_id || used.has(`${follower_id}-${following_id}`));

      used.add(`${follower_id}-${following_id}`);
      follows.push({ follower_id, following_id });
    }
    return follows;
  }

  //生成点赞数据
  generateLikes(userCount, postCount, commentCount, count = 1000) {
    const likes = [];
    const used = new Set();

    for (let i = 0; i < count; i++) {
      let user_id, target_id;
      const target_type = Math.random() > 0.8 ? 2 : 1; // 80%点赞笔记，20%点赞评论

      do {
        user_id = Math.floor(Math.random() * userCount) + 1;
        if (target_type === 1) {
          // 点赞笔记
          target_id = Math.floor(Math.random() * postCount) + 1;
        } else {
          // 点赞评论
          target_id = Math.floor(Math.random() * commentCount) + 1;
        }
      } while (used.has(`${user_id}-${target_type}-${target_id}`));

      used.add(`${user_id}-${target_type}-${target_id}`);
      likes.push({ user_id, target_type, target_id });
    }
    return likes;
  }

  //生成收藏数据
  generateCollections(userCount, postCount, count = 400) {
    const collections = [];
    const used = new Set();

    for (let i = 0; i < count; i++) {
      let user_id, post_id;
      do {
        user_id = Math.floor(Math.random() * userCount) + 1;
        post_id = Math.floor(Math.random() * postCount) + 1;
      } while (used.has(`${user_id}-${post_id}`));

      used.add(`${user_id}-${post_id}`);
      collections.push({ user_id, post_id });
    }
    return collections;
  }

  //生成评论数据
  generateComments(users, postCount, count = 800) {
    const userCount = users.length;
    const comments = [];
    const commentTexts = [
      // 表达赞同和支持
      '很棒的分享！', '学到了很多', '感谢分享', '很有用的内容', '支持楼主', '写得很好', '很有启发', '收藏了',
      '同感', '很实用', '谢谢分享', '很有意思', '赞同你的观点', '很有道理', '学习了', '很棒的经验',
      '说得太对了！', '深有同感', '受益匪浅', '太有用了', '必须点赞', '说到心坎里了', '完全同意',

      // 表达疑问和讨论
      '有个问题想请教一下', '这个方法真的有效吗？', '能详细说说吗？', '有没有更好的建议？',
      '我觉得还可以这样...', '补充一点', '我的经验是...', '不过我觉得...', '另外一个角度来看',
      '有没有遇到过这种情况？', '求更多细节', '能分享下具体操作吗？', '有类似经历',

      // 表达感谢和鼓励
      '谢谢楼主的分享', '真的帮到我了', '正好需要这个', '解决了我的困惑', '及时雨啊',
      '楼主太厉害了', '继续加油', '期待更多分享', '关注了', '马克一下',

      // 表达情感共鸣
      '太真实了', '说出了我的心声', '感同身受', '我也是这样想的', '引起共鸣了',
      '看哭了', '太感动了', '很温暖', '正能量满满', '很治愈',

      // 日常互动
      '沙发！', '前排支持', '来晚了', '围观学习', '默默点赞', '路过留名',
      '顶一个', '好文章', '值得收藏', '转发了', '分享给朋友',

      // 具体建议和补充
      '建议可以试试...', '我一般会这样做', '还有一个小技巧', '注意这个细节',
      '我的做法是...', '推荐一个工具', '可以参考这个', '类似的还有...',

      // 表达不同观点（礼貌）
      '我有不同看法', '可能因人而异吧', '我的情况有点不同', '也许还有其他方式',
      '个人觉得...', '从我的角度来看', '可能需要具体分析', '情况比较复杂',

      // 校园相关
      '学长学姐太厉害了', '作为学弟学妹表示膜拜', '这就是大学生活啊', '青春回忆杀',
      '想念校园时光', '现在的学生真幸福', '当年我们也是这样', '时代不同了',

      // 生活感悟
      '生活不易', '且行且珍惜', '每天都在成长', '感谢生活的美好',
      '平凡中的小确幸', '简单就是幸福', '知足常乐', '珍惜当下',

      // 网络用语
      '666', '牛啊', 'yyds', '绝了', '太强了', '服气', '厉害厉害',
      '学废了', '我酸了', '柠檬精上线', '这就是差距', '人比人气死人'
    ];

    // 带 @用户的评论模板
    const mentionCommentTemplates = [
      ' 这个内容不错，你可以看看 ',
      ' 这个挺有意思的，分享给你 ',
      ' 这个值得一看，你肯定会感兴趣 ',
      ' 觉得这个对你有帮助，过来看看 ',
      ' 这个挺好的，推荐给你 ',
      ' 看到这个就想到你了，来看看吧 ',
      ' 这个内容不错，你可能会喜欢 ',
      ' 这个挺有价值的，分享给你 ',
      ' 这个值得关注，你可以了解下 ',
      ' 觉得这个不错，你也看看吧 ',
      ' 这个内容挺好，推荐你看一下 ',
      ' 这个挺实用的，你可以参考下 ',
      ' 看到这个就想让你也看看 ',
      ' 这个内容不错，分享给你参考 ',
      ' 这个挺有意思，你过来看看 '
    ];


    // 按笔记分组生成评论，确保回复评论的parent_id指向同一笔记下的评论
    const commentsByPost = {};

    for (let i = 0; i < count; i++) {
      const postId = Math.floor(Math.random() * postCount) + 1;

      // 初始化该笔记的评论数组
      if (!commentsByPost[postId]) {
        commentsByPost[postId] = [];
      }

      const existingCommentsForPost = commentsByPost[postId];
      let parentId = null;

      // 30%的概率生成回复评论，且该笔记下必须已有评论
      if (existingCommentsForPost.length > 0 && Math.random() > 0.7) {
        // 随机选择该笔记下的一个已存在评论作为父评论
        const randomIndex = Math.floor(Math.random() * existingCommentsForPost.length);
        parentId = existingCommentsForPost[randomIndex].id;
      }

      let content;

      // 15%的概率生成带@用户的评论
      if (Math.random() < 0.15) {
        // 随机选择一个用户进行@
        const mentionedUserIndex = Math.floor(Math.random() * userCount);
        const mentionedUser = users[mentionedUserIndex];
        const mentionedUserDisplayId = mentionedUser.user_id;
        const mentionedNickname = mentionedUser.nickname;
        const mentionText = mentionCommentTemplates[Math.floor(Math.random() * mentionCommentTemplates.length)];

        //生成HTML格式的@用户评论
        content = `<p><a href="/user/${mentionedUserDisplayId}" data-user-id="${mentionedUserDisplayId}" class="mention-link" contenteditable="false">@${mentionedNickname}</a>&nbsp;${mentionText}</p>`;
      } else {
        //生成普通评论
        content = commentTexts[Math.floor(Math.random() * commentTexts.length)];
      }

      const comment = {
        id: i + 1, // 临时ID，用于生成过程中的引用
        post_id: postId,
        user_id: Math.floor(Math.random() * userCount) + 1,
        parent_id: parentId,
        content: content,
        like_count: Math.floor(Math.random() * 20)
      };

      // 添加到对应笔记的评论列表中
      commentsByPost[postId].push(comment);
      comments.push(comment);
    }

    // 移除临时ID字段
    return comments.map(comment => {
      const { id, ...commentWithoutId } = comment;
      return commentWithoutId;
    });
  }


  //生成用户会话数据 - 每个用户一条session记录
  generateUserSessions(userCount) {
    const sessions = [];
    const userAgents = [
      // Windows Chrome
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

      // Windows Edge
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',

      // Windows Firefox
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',

      // macOS Chrome
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',

      // macOS Safari
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',

      // iPhone Safari
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',

      // Android Chrome
      'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',

      // Android Firefox
      'Mozilla/5.0 (Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',
      'Mozilla/5.0 (Android 14; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',

      // iPad Safari
      'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPad; CPU OS 16_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    ];

    // 真实的中国公网IP地址段
    const ipRanges = [
      // 中国电信
      () => `59.${Math.floor(Math.random() * 64) + 32}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // 59.32.0.0/11
      () => `61.${Math.floor(Math.random() * 64) + 128}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // 61.128.0.0/10
      () => `114.${Math.floor(Math.random() * 64) + 80}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // 114.80.0.0/12
      () => `183.${Math.floor(Math.random() * 64) + 192}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // 183.192.0.0/10

      // 中国联通
      () => `123.${Math.floor(Math.random() * 128) + 112}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // 123.112.0.0/12
      () => `125.${Math.floor(Math.random() * 64) + 64}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // 125.64.0.0/11
      () => `221.${Math.floor(Math.random() * 32) + 192}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // 221.192.0.0/11

      // 中国移动
      () => `117.${Math.floor(Math.random() * 64) + 128}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // 117.128.0.0/10
      () => `223.${Math.floor(Math.random() * 64) + 64}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // 223.64.0.0/10

      // 其他中国ISP
      () => `101.${Math.floor(Math.random() * 64) + 64}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // 101.64.0.0/11
      () => `106.${Math.floor(Math.random() * 64) + 80}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // 106.80.0.0/12
      () => `112.${Math.floor(Math.random() * 64) + 64}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // 112.64.0.0/11
      () => `119.${Math.floor(Math.random() * 64) + 128}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` // 119.128.0.0/11
    ];

    // 为每个用户生成一条session记录
    for (let userId = 1; userId <= userCount; userId++) {
      const session = {
        user_id: userId,
        token: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        refresh_token: `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
        user_agent: userAgents[Math.floor(Math.random() * userAgents.length)],
        is_active: Math.random() > 0.2 ? 1 : 0 // 80%活跃
      };
      sessions.push(session);
    }
    return sessions;
  }

  //生成用户标签数据


  // 插入数据到数据库
  async insertData() {
    let connection;
    try {
      console.log('开始生成模拟数据...');

      // 从连接池获取连接
      connection = await pool.getConnection();
      console.log('数据库连接成功');

      // 清空现有数据
      await this.clearTables(connection);

      // 第零步：生成并插入管理员数据
      console.log('生成管理员数据...');
      const admins = this.generateAdmins();
      await this.insertAdmins(connection, admins);

      // 第一步：生成并插入用户数据（初始统计为0）
      console.log('生成用户数据...');
      const users = this.generateUsers(50);
      await this.insertUsers(connection, users);

      // 第二步：生成并插入标签数据（初始使用次数为0）
      console.log('生成标签数据...');
      const tags = this.generateTags();
      await this.insertTags(connection, tags);

      // 第二步.一：生成并插入分类数据
      console.log('生成分类数据...');
      const categories = this.generateCategories();
      await this.insertCategories(connection, categories);

      // 第三步：生成并插入笔记数据（初始统计为0）
      console.log('生成笔记数据...');
      const posts = this.generatePosts(users.length, 200);
      await this.insertPosts(connection, posts);

      // 第四步：生成并插入笔记图片数据
      console.log('生成笔记图片数据...');
      const postImages = this.generatePostImages(posts.length);
      await this.insertPostImages(connection, postImages);

      // 第五步：生成并插入关注关系数据，同时更新用户统计
      console.log('生成关注关系数据...');
      const follows = this.generateFollows(users.length, 300);
      await this.insertFollowsWithStats(connection, follows, users.length);

      // 第六步：生成并插入评论数据，同时更新笔记统计
      console.log('生成评论数据...');
      const comments = this.generateComments(users, posts.length, 800);
      const postCommentStats = {}; // 笔记评论统计
      const insertedCommentIds = []; // 存储已插入的评论ID

      // 初始化统计
      for (let i = 1; i <= posts.length; i++) {
        postCommentStats[i] = 0;
      }

      for (let i = 0; i < comments.length; i++) {
        const comment = comments[i];
        const result = await connection.execute(
          'INSERT INTO comments (post_id, user_id, parent_id, content, like_count) VALUES (?, ?, ?, ?, ?)',
          [comment.post_id, comment.user_id, comment.parent_id, comment.content, comment.like_count]
        );

        // 存储插入后的评论ID
        const insertedId = result[0].insertId;
        insertedCommentIds.push(insertedId);
        comments[i].id = insertedId; // 更新评论对象的ID

        postCommentStats[comment.post_id]++;
      }

      // 更新笔记评论数
      for (let postId = 1; postId <= posts.length; postId++) {
        await connection.execute(
          'UPDATE posts SET comment_count = ? WHERE id = ?',
          [postCommentStats[postId], postId]
        );
      }

      console.log(`     已插入 ${comments.length} 个评论并更新笔记统计`);

      // 第七步：生成并插入点赞数据，同时更新笔记和用户统计
      console.log('生成点赞数据...');
      const likes = this.generateLikes(users.length, posts.length, comments.length, 1000);
      const postLikeStats = {}; // 笔记点赞统计
      const userLikeStats = {}; // 用户获得点赞统计

      // 初始化统计
      for (let i = 1; i <= posts.length; i++) {
        postLikeStats[i] = 0;
      }
      for (let i = 1; i <= users.length; i++) {
        userLikeStats[i] = 0;
      }

      for (const like of likes) {
        await connection.execute(
          'INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)',
          [like.user_id, like.target_type, like.target_id]
        );

        // 如果是点赞笔记
        if (like.target_type === 1) {
          postLikeStats[like.target_id]++;

          // 获取笔记作者，增加其获得点赞数
          const postAuthor = posts[like.target_id - 1].user_id;
          userLikeStats[postAuthor]++;
        }
      }

      // 更新笔记点赞数
      for (let postId = 1; postId <= posts.length; postId++) {
        await connection.execute(
          'UPDATE posts SET like_count = ? WHERE id = ?',
          [postLikeStats[postId], postId]
        );
      }

      // 更新用户获得点赞数
      for (let userId = 1; userId <= users.length; userId++) {
        await connection.execute(
          'UPDATE users SET like_count = ? WHERE id = ?',
          [userLikeStats[userId], userId]
        );
      }

      // 第八步：生成并插入收藏数据，同时更新笔记统计
      console.log('生成收藏数据...');
      const collections = this.generateCollections(users.length, posts.length, 400);
      const postCollectStats = {}; // 笔记收藏统计

      // 初始化统计
      for (let i = 1; i <= posts.length; i++) {
        postCollectStats[i] = 0;
      }

      for (const collection of collections) {
        await connection.execute(
          'INSERT INTO collections (user_id, post_id) VALUES (?, ?)',
          [collection.user_id, collection.post_id]
        );

        postCollectStats[collection.post_id]++;
      }

      // 更新笔记收藏数
      for (let postId = 1; postId <= posts.length; postId++) {
        await connection.execute(
          'UPDATE posts SET collect_count = ? WHERE id = ?',
          [postCollectStats[postId], postId]
        );
      }

      // 第九步：生成笔记标签关联数据，同时更新标签使用次数
      console.log('生成笔记标签关联数据...');
      const tagUseStats = {}; // 标签使用统计

      // 初始化统计
      for (let i = 1; i <= tags.length; i++) {
        tagUseStats[i] = 0;
      }

      for (let postId = 1; postId <= posts.length; postId++) {
        const tagCount = Math.floor(Math.random() * 3) + 1;
        const usedTags = new Set();
        for (let i = 0; i < tagCount; i++) {
          let tagId;
          do {
            tagId = Math.floor(Math.random() * tags.length) + 1;
          } while (usedTags.has(tagId));
          usedTags.add(tagId);

          await connection.execute(
            'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
            [postId, tagId]
          );

          tagUseStats[tagId]++;
        }
      }

      // 更新标签使用次数
      for (let tagId = 1; tagId <= tags.length; tagId++) {
        await connection.execute(
          'UPDATE tags SET use_count = ? WHERE id = ?',
          [tagUseStats[tagId], tagId]
        );
      }

      // 第十步：基于实际数据生成通知
      console.log('生成通知数据...');
      const notifications = [];

      /*
       * 通知类型定义：
       * 1 - 点赞笔记：赞了你的笔记
       * 2 - 点赞评论：赞了你的评论
       * 3 - 收藏笔记：收藏了你的笔记
       * 4 - 评论笔记：评论了你的笔记
       * 5 - 回复评论：回复了你的评论
       * 6 - 关注：关注了你（前端根据互关状态渲染为"关注了你"或"回关了你"）
       * 7 - @提及：在评论中@了你
       */

      // 基于点赞生成通知
      for (const like of likes) {
        if (like.target_type === 1) { // 点赞笔记
          const postAuthor = posts[like.target_id - 1].user_id;
          if (like.user_id !== postAuthor) { // 不给自己发通知
            const notificationData = NotificationHelper.createLikePostNotification(
              postAuthor,
              like.user_id,
              like.target_id
            );
            notificationData.is_read = Math.random() > 0.4 ? 1 : 0;
            notifications.push(notificationData);
          }
        } else if (like.target_type === 2) { // 点赞评论
          // 需要找到评论的作者
          const comment = comments.find(c => c.id === like.target_id);
          if (comment && like.user_id !== comment.user_id) { // 不给自己发通知
            const notificationData = NotificationHelper.createLikeCommentNotification(
              comment.user_id,
              like.user_id,
              comment.post_id, // 使用笔记ID便于跳转
              comment.id // 关联具体评论
            );
            notificationData.is_read = Math.random() > 0.4 ? 1 : 0;
            notifications.push(notificationData);
          }
        }
      }

      // 基于评论生成通知
      for (let i = 0; i < comments.length; i++) {
        const comment = comments[i];

        // 检查评论是否包含@用户，生成@提及通知
        if (comment.content && comment.content.includes('mention-link')) {
          // 提取@用户信息（简化处理，从HTML中提取data-user-id）
          const mentionMatches = comment.content.match(/data-user-id="([^"]+)"/g);
          if (mentionMatches) {
            for (const match of mentionMatches) {
              const userIdMatch = match.match(/data-user-id="([^"]+)"/);
              if (userIdMatch) {
                const mentionedUserDisplayId = userIdMatch[1];
                // 根据display_id找到对应的自增ID
                const mentionedUser = users.find(u => u.user_id === mentionedUserDisplayId);
                if (mentionedUser && mentionedUser.id !== comment.user_id) { // 不给自己发通知
                  const notificationData = NotificationHelper.createMentionNotification(
                    mentionedUser.id,
                    comment.user_id,
                    comment.post_id,
                    comment.id
                  );
                  notificationData.is_read = Math.random() > 0.4 ? 1 : 0;
                  notifications.push(notificationData);
                }
              }
            }
          }
        }

        if (comment.parent_id) {
          // 回复评论的通知
          const parentComment = comments.find(c => c.id === comment.parent_id);
          if (parentComment && comment.user_id !== parentComment.user_id) { // 不给自己发通知
            const notificationData = NotificationHelper.createReplyCommentNotification(
              parentComment.user_id,
              comment.user_id,
              comment.post_id,
              comment.id // 关联具体回复评论
            );
            notificationData.is_read = Math.random() > 0.4 ? 1 : 0;
            notifications.push(notificationData);
          }
        } else {
          // 评论笔记的通知
          const postAuthor = posts[comment.post_id - 1].user_id;
          if (comment.user_id !== postAuthor) { // 不给自己发通知
            const notificationData = NotificationHelper.createCommentPostNotification(
              postAuthor,
              comment.user_id,
              comment.post_id,
              comment.id // 关联具体评论
            );
            notificationData.is_read = Math.random() > 0.4 ? 1 : 0;
            notifications.push(notificationData);
          }
        }
      }

      // 基于关注生成通知
      for (const follow of follows) {
        const notificationData = NotificationHelper.createFollowNotification(
          follow.following_id,
          follow.follower_id
        );
        notificationData.is_read = Math.random() > 0.4 ? 1 : 0;
        notifications.push(notificationData);
      }

      // 基于收藏生成通知
      for (const collection of collections) {
        const postAuthor = posts[collection.post_id - 1].user_id;
        if (collection.user_id !== postAuthor) { // 不给自己发通知
          const notificationData = NotificationHelper.createCollectPostNotification(
            postAuthor,
            collection.user_id,
            collection.post_id
          );
          notificationData.is_read = Math.random() > 0.4 ? 1 : 0;
          notifications.push(notificationData);
        }
      }

      // 插入通知数据
      for (let i = 0; i < notifications.length; i++) {
        const notification = notifications[i];

        // 检查是否有undefined字段
        const params = [notification.user_id, notification.sender_id, notification.type, notification.title, notification.target_id, notification.comment_id || null, notification.is_read];
        const hasUndefined = params.some(param => param === undefined);

        if (hasUndefined) {
          console.error(`Notification ${i} has undefined parameters:`, {
            user_id: notification.user_id,
            sender_id: notification.sender_id,
            type: notification.type,
            title: notification.title,
            target_id: notification.target_id,
            comment_id: notification.comment_id,
            is_read: notification.is_read
          });
          continue; // 跳过这个有问题的通知
        }

        await connection.execute(
          'INSERT INTO notifications (user_id, sender_id, type, title, target_id, comment_id, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)',
          params
        );
      }

      // 第十一步：生成并插入用户会话数据 - 每个用户一条session
      console.log('生成用户会话数据...');
      const userSessions = this.generateUserSessions(users.length);
      for (const session of userSessions) {
        await connection.execute(
          'INSERT INTO user_sessions (user_id, token, refresh_token, expires_at, user_agent, is_active) VALUES (?, ?, ?, ?, ?, ?)',
          [session.user_id, session.token, session.refresh_token, session.expires_at, session.user_agent, session.is_active]
        );
      }

      console.log('模拟数据生成完成！');
      console.log(`  数据统计:`);
      console.log(`   管理员: ${admins.length} 个`);
      console.log(`   用户: ${users.length} 个`);
      console.log(`   标签: ${tags.length} 个`);
      console.log(`   笔记: ${posts.length} 个`);
      console.log(`   图片: ${postImages.length} 张`);
      console.log(`   关注关系: ${follows.length} 个`);
      console.log(`   点赞: ${likes.length} 个`);
      console.log(`   收藏: ${collections.length} 个`);
      console.log(`   评论: ${comments.length} 个`);
      console.log(`   通知: ${notifications.length} 个`);
      console.log(`   会话: ${userSessions.length} 个`);
      console.log(`   分类列表: ${this.categories.join(', ')}`);

    } catch (error) {
      console.error('生成模拟数据失败:', error);
    } finally {
      if (connection) {
        connection.release();
        console.log('数据库连接已释放回连接池');
      }
    }
  }

  // 生成分类数据
  generateCategories() {
    // 分类中英文对照
    const categoryMapping = {
      '学习': 'study',
      '校园': 'campus',
      '情感': 'emotion',
      '兴趣': 'interest',
      '生活': 'life',
      '社交': 'social',
      '求助': 'help',
      '观点': 'opinion',
      '毕业': 'graduation',
      '职场': 'career'
    };

    return this.categories.map(name => ({
      name: name,
      category_title: categoryMapping[name]
    }));
  }

  // 插入分类数据
  async insertCategories(connection, categories) {
    for (const category of categories) {
      await connection.execute(
        'INSERT IGNORE INTO categories (name, category_title) VALUES (?, ?)',
        [category.name, category.category_title]
      );
    }
    console.log(`     已插入 ${categories.length} 个分类`);
  }
}

// 等待用户按回车退出
async function waitForExit() {
  console.log('\n按回车键退出...');
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      resolve();
    });
  });
}

// 运行数据生成器
if (require.main === module) {
  const generator = new DataGenerator();
  generator.insertData().then(async () => {
    await waitForExit();
    process.exit(0);
  }).catch(async () => {
    await waitForExit();
    process.exit(1);
  });
}

module.exports = DataGenerator;