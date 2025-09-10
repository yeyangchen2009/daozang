# 使用示例

## 道藏项目使用示例

假设您有一个道藏项目的目录结构如下：

```
daozang/
├── 道藏/
│   ├── 灵宝部/
│   │   ├── 灵宝经.md
│   │   ├── 灵宝符.md
│   │   └── 灵宝斋仪.md
│   ├── 神霄部/
│   │   ├── 神霄经.md
│   │   └── 神霄法.md
│   └── 正一部/
│       ├── 正一法.md
│       └── 正一科仪.md
```

要为这个项目生成文档，您可以运行：

```bash
node generate-docs-final.js ./daozang 道藏
```

执行后将生成以下文件：

### 根目录 README.md
```markdown
# 道藏

| 归类 | 书籍数量 | 预估字数 | 大小 |
| --- | --- | --- | --- |
| [道藏](道藏/README.md) | 7 | xxx 字 | x.xx MB |
| [灵宝部](道藏/灵宝部/README.md) | 3 | xxx 字 | x.xx MB |
| [神霄部](道藏/神霄部/README.md) | 2 | xxx 字 | x.xx MB |
| [正一部](道藏/正一部/README.md) | 2 | xxx 字 | x.xx MB |

---
> 本README文件由系统自动生成，请勿手动修改。
```

### 根目录 _sidebar.md
```markdown
* [首页](README.md)
* [道藏](道藏/README.md)

---
* [灵宝部](道藏/灵宝部/README.md)
* [神霄部](道藏/神霄部/README.md)
* [正一部](道藏/正一部/README.md)
```

## 大藏经项目使用示例

假设您有一个大藏经项目的目录结构如下：

```
dazangjing/
├── 大藏经/
│   ├── 经藏/
│   │   ├── 般若部/
│   │   │   ├── 金刚经.md
│   │   │   └── 心经.md
│   │   └── 法华部/
│   │       ├── 法华经.md
│   │       └── 无量义经.md
│   └── 论藏/
│       ├── 中观论.md
│       └── 唯识论.md
```

要为这个项目生成文档，您可以运行：

```bash
node generate-docs-final.js ./dazangjing 大藏经
```

执行后将生成相应的 README.md 和 _sidebar.md 文件。

## 注意事项

1. 脚本会自动递归处理所有子目录
2. 只会处理 .md 文件
3. 会自动忽略已存在的 README.md 和 _sidebar.md 文件
4. 文件统计信息基于 UTF-8 编码计算（3字节约等于1汉字）
5. 文件大小会自动格式化为 B、KB 或 MB 单位