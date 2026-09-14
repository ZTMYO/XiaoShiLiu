#!/bin/bash
# 小石榴图文社区 Docker 一键部署脚本
# Bash 版本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo -e "${CYAN}小石榴图文社区 Docker 部署脚本${NC}"
    echo -e "${YELLOW}用法: ./deploy.sh [选项]${NC}"
    echo ""
    echo -e "${GREEN}选项:${NC}"
    echo -e "  --build    强制重新构建镜像并启动服务"
    echo -e "  --stop     停止所有服务"
    echo -e "  --clean    清理所有容器、镜像和数据卷"
    echo -e "  --logs     查看服务日志"
    echo -e "  --status   查看服务状态"
    echo -e "  --seed     初始化数据库并生成测试数据"
    echo -e "  --help     显示此帮助信息"
    echo ""
    echo -e "${GREEN}示例:${NC}"
    echo -e "  ./deploy.sh          # 启动服务"
    echo -e "  ./deploy.sh --build  # 重新构建并启动"
    echo -e "  ./deploy.sh --stop   # 停止服务"
    echo -e "  ./deploy.sh --seed   # 生成测试数据"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}错误: 未找到 Docker${NC}"
        echo -e "${YELLOW}请先安装 Docker: https://docs.docker.com/get-docker/${NC}"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        echo -e "${RED}错误: 未找到 Docker Compose${NC}"
        echo -e "${YELLOW}请先安装 Docker Compose: https://docs.docker.com/compose/install/${NC}"
        exit 1
    fi
}

# 检查环境变量文件
check_env_file() {
    if [ ! -f ".env" ]; then
        if [ -f ".env.docker" ]; then
            echo -e "${YELLOW}复制 .env.docker 到 .env${NC}"
            cp .env.docker .env
        else
            echo -e "${YELLOW}警告: 未找到 .env 文件，将使用默认配置${NC}"
        fi
    fi
}

# 启动服务
start_services() {
    echo -e "${GREEN}启动小石榴图文社区服务...${NC}"
    
    if [ "$1" = "--build" ]; then
        echo -e "${YELLOW}重新构建镜像...${NC}"
        docker compose down
        docker compose build --no-cache
    fi
    
    docker compose up -d
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 所有服务已成功启动！${NC}"
        echo -e "\n${BLUE}服务访问地址：${NC}"
        echo -e "  前端界面: ${GREEN}http://localhost:8080${NC}"
        echo -e "  后端API:  ${GREEN}http://localhost:3001${NC}"
        echo -e "  数据库:   ${GREEN}localhost:3307${NC}"
        echo -e "\n${YELLOW}注意：容器已配置为中国时区(Asia/Shanghai)${NC}"
        echo ""
        echo -e "${YELLOW}使用 './deploy.sh --logs' 查看日志${NC}"
        echo -e "${YELLOW}使用 './deploy.sh --status' 查看服务状态${NC}"
    else
        echo -e "${RED}服务启动失败!${NC}"
        echo -e "${YELLOW}请检查日志: docker compose logs${NC}"
        exit 1
    fi
}

# 停止服务
stop_services() {
    echo -e "${YELLOW}停止小石榴图文社区服务...${NC}"
    docker compose down
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}服务已停止${NC}"
    else
        echo -e "${RED}停止服务时出现错误${NC}"
        exit 1
    fi
}

# 清理资源
clean_resources() {
    echo -e "${RED}警告: 此操作将删除所有容器、镜像和数据!${NC}"
    read -p "确认继续? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}清理Docker资源...${NC}"
        docker compose down -v --rmi all
        docker system prune -f
        echo -e "${GREEN}清理完成${NC}"
    else
        echo -e "${YELLOW}操作已取消${NC}"
    fi
}

# 查看日志
show_logs() {
    echo -e "${CYAN}查看服务日志 (按 Ctrl+C 退出):${NC}"
    docker compose logs -f
}

# 查看状态
show_status() {
    echo -e "${CYAN}服务状态:${NC}"
    docker compose ps
    echo ""
    echo -e "${CYAN}资源使用情况:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# 初始化数据库并生成测试数据
seed_database() {
    echo -e "${YELLOW}初始化数据库并生成测试数据...${NC}"
    
    # 检查后端容器是否运行
    if ! docker compose ps | grep -q "xiaoshiliu-backend.*Up"; then
        echo -e "${RED}错误: 后端服务未运行，请先启动服务${NC}"
        echo -e "${YELLOW}使用 './deploy.sh' 启动服务${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}步骤1: 初始化数据库结构...${NC}"
    docker compose exec backend node scripts/init-database.js
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}数据库初始化成功!${NC}"
        echo -e "${CYAN}步骤2: 生成测试数据...${NC}"
        docker compose exec backend node scripts/generate-data.js
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}测试数据生成成功!${NC}"
            echo -e "${CYAN}数据库已包含:${NC}"
            echo -e "  - 50个测试用户"
            echo -e "  - 200篇测试笔记"
            echo -e "  - 800条测试评论"
            echo -e "  - 完整的分类和标签数据"
        else
            echo -e "${RED}测试数据生成失败!${NC}"
            exit 1
        fi
    else
        echo -e "${RED}数据库初始化失败!${NC}"
        exit 1
    fi
}

# 主逻辑
case "$1" in
    --help)
        show_help
        exit 0
        ;;
    --stop)
        check_docker
        stop_services
        ;;
    --clean)
        check_docker
        clean_resources
        ;;
    --logs)
        check_docker
        show_logs
        ;;
    --status)
        check_docker
        show_status
        ;;
    --seed)
        check_docker
        seed_database
        ;;
    --build)
        check_docker
        check_env_file
        start_services --build
        ;;
    "")
        check_docker
        check_env_file
        start_services
        ;;
    *)
        echo -e "${RED}未知选项: $1${NC}"
        show_help
        exit 1
        ;;
esac

echo -e "${GREEN}操作完成${NC}"
