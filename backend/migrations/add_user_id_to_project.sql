-- 为 projects 表添加 user_id 字段
ALTER TABLE projects ADD COLUMN user_id VARCHAR(36);

-- 为 user_id 创建索引以优化查询性能
CREATE INDEX idx_projects_user_id ON projects(user_id);
