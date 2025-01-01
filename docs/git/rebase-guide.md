# Git Rebase 详解

## 什么是 Rebase

Rebase 字面意思是"重新基准"，它可以将一个分支的修改整合到另一个分支。与 merge 不同，rebase 通过修改提交历史来创建线性的提交记录。

## 基本用法

### 1. 最简单的 Rebase

```bash
# 初始状态
      A---B---C (feature)
     /
D---E---F---G (main)

# 执行 rebase
git checkout feature
git rebase main

# 结果
              A'--B'--C' (feature)
             /
D---E---F---G (main)
```

### 2. 交互式 Rebase

```bash
# 修改最近的 3 次提交
git rebase -i HEAD~3

# 会打开编辑器，显示如下内容：
pick abc123 feat: add feature A
pick def456 fix: fix bug in A
pick ghi789 docs: update docs

# 可用命令：
# p, pick = 保留该commit
# r, reword = 保留commit，但修改提交信息
# e, edit = 保留commit，但停下来修改内容
# s, squash = 将commit合并到前一个commit
# f, fixup = 将commit合并到前一个commit，但丢弃提交信息
# d, drop = 删除commit
```

## 常见使用场景

### 1. 保持分支最新

```bash
# 在功能分支开发时，同步主分支的更新
git checkout feature
git rebase main

# 如果有冲突
git add .
git rebase --continue
# 或者放弃 rebase
git rebase --abort
```

### 2. 整理提交历史

```bash
# 合并多个提交
git checkout feature
git rebase -i HEAD~4

# 修改为：
pick abc123 feat: initial implementation
squash def456 fix: typo
squash ghi789 fix: bug
squash jkl012 style: format code

# 结果会将后三个提交合并到第一个提交中
```

### 3. 分支拆分

```bash
# 从一个大功能分支中拆分出小功能
git checkout -b small-feature main
git rebase -i big-feature

# 在编辑器中只保留需要的提交
pick abc123 feat: small feature
drop def456 feat: other feature
drop ghi789 feat: another feature
```

## 高级用法

### 1. onto 参数使用

```bash
# 场景：将特性分支建立在错误的基础上
      A---B---C (feature)
     /
D---E---F---G (wrong-base)
     \
      H---I (main)

# 使用 onto 重定位分支
git rebase --onto main wrong-base feature

# 结果
              A'--B'--C' (feature)
             /
D---E---H---I (main)
```

### 2. 自动处理冲突

```bash
# 配置重用已记录的解决方案
git config --global rerere.enabled true

# 在 rebase 时会自动应用之前的冲突解决方案
git rebase main

# 查看记录的解决方案
git rerere diff
```

### 3. 保留合并历史

```bash
# 默认 rebase 会丢失合并历史
git rebase --rebase-merges main

# 这样可以保留原有的合并提交
```

## 注意事项

1. **不要在公共分支上使用 rebase**

```bash
# ❌ 错误示例
git checkout main
git rebase feature

# ✅ 正确做法
git checkout feature
git rebase main
```

2. **处理大型 rebase**

```bash
# 分步进行 rebase
git rebase --onto main commit1 commit3
git rebase --onto HEAD commit3 commit5
```

3. **保存工作进度**

```bash
# rebase 前保存修改
git stash
git rebase main
git stash pop
```

## 最佳实践

1. **经常性小步 rebase**

```bash
# 每天同步一次主分支
git checkout feature
git fetch origin
git rebase origin/main
```

2. **使用 autosquash**

```bash
# 提交时标记要合并的提交
git commit --fixup abc123

# 之后 rebase 时自动处理
git rebase -i --autosquash main
```

3. **配置 pull 策略**

```bash
# 全局设置
git config --global pull.rebase true

# 单仓库设置
git config pull.rebase true
```
