import { createRouter, createWebHistory } from 'vue-router'
import layout from '@/views/layout/index.vue'
import explore from '@/views/explore/index.vue'
import publish from '@/views/publish/index.vue'
import notification from '@/views/notification/index.vue'
import user from '@/views/user/index.vue'
import userProfile from '@/views/user/UserProfile.vue'
import FollowList from '@/views/user/FollowList.vue'
import ChannelPage from '@/views/explore/ChannelPage.vue'
import PostDetail from '@/views/PostDetail.vue'
import SearchResult from '@/views/search/SearchResult.vue'
import PostManagementPage from '@/views/post-management/index.vue'
import DraftBoxPage from '@/views/draft-box/index.vue'
import NotFound from '@/views/NotFound.vue'
import { getValidChannelPaths } from '@/config/channels'

// 后台管理系统组件
import AdminLogin from '@/views/admin/AdminLogin.vue'
import AdminLayout from '@/views/admin/AdminLayout.vue'
import ApiDocs from '@/views/admin/ApiDocs.vue'
import UserManagement from '@/views/admin/UserManagement.vue'
import PostManagement from '@/views/admin/PostManagement.vue'
import CommentManagement from '@/views/admin/CommentManagement.vue'
import TagManagement from '@/views/admin/TagManagement.vue'
import LikeManagement from '@/views/admin/LikeManagement.vue'
import CollectionManagement from '@/views/admin/CollectionManagement.vue'
import FollowManagement from '@/views/admin/FollowManagement.vue'
import NotificationManagement from '@/views/admin/NotificationManagement.vue'
import SessionManagement from '@/views/admin/SessionManagement.vue'
import AdminManagement from '@/views/admin/AdminManagement.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: layout,
      redirect: '/explore',
      children: [
        {
          path: '/explore',
          name: 'explore',
          component: explore,
          children: [
            {
              path: '',
              name: 'recommend',
              component: ChannelPage
            },
            {
              path: '/explore/:channel',
              name: 'channel',
              component: ChannelPage,
              beforeEnter: (to, from, next) => {
                // 验证频道是否有效
                const validChannelPaths = getValidChannelPaths()
                if (validChannelPaths.includes(to.params.channel)) {
                  to.name = to.params.channel
                  next()
                } else {
                  // 无效频道重定向到推荐页
                  next('/explore')
                }
              }
            }
          ]
        },
        {
          path: '/post',
          name: 'post_detail',
          component: PostDetail
        },
        {
          path: 'publish',
          name: 'publish',
          component: publish,
        },
        {
          path: 'notification',
          name: 'notification',
          component: notification,
        },
        {
          path: 'user',
          name: 'user',
          component: user,
        },
        {
          path: 'user/:userId',
          name: 'user_profile',
          component: userProfile,
        },
        {
          path: 'follow/:type',
          name: 'follow_list',
          component: FollowList,
          beforeEnter: (to, from, next) => {
            // 验证type参数是否有效
            const validTypes = ['mutual', 'following', 'followers']
            if (validTypes.includes(to.params.type)) {
              next()
            } else {
              // 无效type重定向到following
              next({
                name: 'follow_list',
                params: { type: 'following' }
              })
            }
          }
        },
        {
          path: 'search_result',
          name: 'search_result',
          component: SearchResult,
          beforeEnter: (to, from, next) => {
            // 自动重定向到 "全部" tab
            next({
              name: 'search_result_tab',
              params: { tab: 'all' },
              query: to.query // 保持查询参数（如keyword）
            })
          }
        },
        {
          path: 'search_result/:tab',
          name: 'search_result_tab',
          component: SearchResult,
          beforeEnter: (to, from, next) => {
            // 验证tab参数是否有效
            const validTabs = ['all', 'note', 'video', 'user']
            if (validTabs.includes(to.params.tab)) {
              next()
            } else {
              // 无效tab重定向到all
              next({
                name: 'search_result_tab',
                params: { tab: 'all' },
                query: to.query
              })
            }
          }
        },
        {
          path: 'post-management',
          name: 'post_management',
          component: PostManagementPage
        },
        {
          path: 'draft-box',
          name: 'draft_box',
          component: DraftBoxPage
        },
        // 404页面 - 捕获所有未匹配的路由
        {
          path: '/:pathMatch(.*)*',
          name: 'not_found',
          component: NotFound
        }
      ]
    },
    // Admin登录页面
    {
      path: '/admin/login',
      name: 'admin_login',
      component: AdminLogin
    },
    // 后台管理系统路由
    {
      path: '/admin',
      component: AdminLayout,
      beforeEnter: (to, from, next) => {
        // 如果访问的是/admin根路径，重定向到api-docs
        if (to.path === '/admin') {
          next('/admin/api-docs')
        } else {
          next()
        }
      },
      children: [
        {
          path: 'api-docs',
          name: 'admin_api_docs',
          component: ApiDocs
        },
        {
          path: 'users',
          name: 'admin_users',
          component: UserManagement
        },
        {
          path: 'posts',
          name: 'admin_posts',
          component: PostManagement
        },
        {
          path: 'comments',
          name: 'admin_comments',
          component: CommentManagement
        },
        {
          path: 'tags',
          name: 'admin_tags',
          component: TagManagement
        },
        {
          path: 'likes',
          name: 'admin_likes',
          component: LikeManagement
        },
        {
          path: 'collections',
          name: 'admin_collections',
          component: CollectionManagement
        },
        {
          path: 'follows',
          name: 'admin_follows',
          component: FollowManagement
        },
        {
          path: 'notifications',
          name: 'admin_notifications',
          component: NotificationManagement
        },
        {
          path: 'sessions',
          name: 'admin_sessions',
          component: SessionManagement
        },
        {
          path: 'admins',
          name: 'admin_admins',
          component: AdminManagement
        }
      ]
    }
  ],
})

export default router
