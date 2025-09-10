#!/usr/bin/env node

/**
 * Docsify 文档自动生成脚本
 * 
 * 该脚本可以自动为符合特定结构的文档项目生成 README.md 和 _sidebar.md 文件
 * 
 * 使用方法:
 *   node generate-docs-final.js [根目录路径] [指定路径名称]
 * 
 * 参数说明:
 *   根目录路径 (可选): 要处理的根目录路径，默认为当前目录
 *   指定路径名称 (可选): 包含所有子分类的主目录名称，默认为"艺藏"
 * 
 * 使用示例:
 *   node generate-docs-final.js                    # 使用默认参数
 *   node generate-docs-final.js ./daozang 道藏     # 指定根目录和路径名称
 *   node generate-docs-final.js ./dazang 大藏经    # 指定根目录和路径名称
 */

const fs = require('fs');
const path = require('path');

// 配置选项
const config = {
  // 要忽略的文件名列表
  ignoreFiles: ['_sidebar.md', 'README.md', '_navbar.md', '_coverpage.md'],
  // 指定的路径名称（可以通过命令行参数传入）
  specifiedPath: process.argv[3] || '艺藏',
  // 缩进字符
  indentChar: '  ',
  // 字符编码设置
  encoding: 'utf8'
};

// 获取命令行参数作为根目录，默认为当前目录
const rootDir = process.argv[2] || '.';

/**
 * 获取文件大小并格式化
 * @param {string} filePath 文件路径
 * @returns {object} 包含大小和格式化大小的对象
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const size = stats.size;
    
    if (size < 1024) {
      return { size: size, formatted: size + ' B' };
    } else if (size < 1024 * 1024) {
      return { size: size, formatted: Math.round(size / 1024 * 100) / 100 + ' KB' };
    } else {
      return { size: size, formatted: Math.round(size / (1024 * 1024) * 100) / 100 + ' MB' };
    }
  } catch (err) {
    return { size: 0, formatted: '0 B' };
  }
}

/**
 * 获取目录大小并格式化
 * @param {string} dirPath 目录路径
 * @returns {object} 包含大小和格式化大小的对象
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    const list = fs.readdirSync(dirPath);
    
    list.forEach(file => {
      const fullPath = path.resolve(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        totalSize += getDirectorySize(fullPath).size;
      } else {
        totalSize += stat.size;
      }
    });
    
    if (totalSize < 1024) {
      return { size: totalSize, formatted: totalSize + ' B' };
    } else if (totalSize < 1024 * 1024) {
      return { size: totalSize, formatted: Math.round(totalSize / 1024 * 100) / 100 + ' KB' };
    } else {
      return { size: totalSize, formatted: Math.round(totalSize / (1024 * 1024) * 100) / 100 + ' MB' };
    }
  } catch (err) {
    return { size: 0, formatted: '0 B' };
  }
}

/**
 * 估算文件字数（UTF-8编码，3个字节约等于1个汉字）
 * @param {string} filePath 文件路径
 * @returns {number} 估算的字数
 */
function estimateWordCount(filePath) {
  try {
    const content = fs.readFileSync(filePath, config.encoding);
    // UTF-8编码中，汉字通常占3个字节
    // 我们假设3个字节约等于1个汉字
    return Math.round(Buffer.byteLength(content, 'utf8') / 3);
  } catch (err) {
    return 0;
  }
}

/**
 * 估算目录字数（UTF-8编码，3个字节约等于1个汉字）
 * @param {string} dirPath 目录路径
 * @returns {number} 估算的字数
 */
function estimateDirectoryWordCount(dirPath) {
  let totalWordCount = 0;
  
  try {
    const list = fs.readdirSync(dirPath);
    
    list.forEach(file => {
      const fullPath = path.resolve(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        totalWordCount += estimateDirectoryWordCount(fullPath);
      } else if (path.extname(file) === '.md') {
        totalWordCount += estimateWordCount(fullPath);
      }
    });
    
    return totalWordCount;
  } catch (err) {
    return 0;
  }
}

/**
 * 递归获取目录结构
 * @param {string} dir 目录路径
 * @param {number} depth 当前深度
 * @returns {Object} 目录结构对象
 */
function getDirectoryStructure(dir, depth = 0) {
  const result = {
    name: path.basename(dir),
    path: dir,
    type: 'directory',
    children: [],
    depth: depth
  };
  
  // 检查目录是否存在
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    return result;
  }
  
  const list = fs.readdirSync(dir);
  
  // 分离文件和目录
  const files = [];
  const directories = [];
  
  list.forEach(file => {
    // 检查是否在忽略列表中
    if (config.ignoreFiles.includes(file)) {
      return;
    }
    
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat && stat.isDirectory()) {
      directories.push(file);
    } else if (path.extname(file) === '.md') {
      files.push(file);
    }
  });
  
  // 先处理文件（按字母顺序排序）
  files.sort().forEach(file => {
    const fullPath = path.resolve(dir, file);
    const fileSize = getFileSize(fullPath);
    const wordCount = estimateWordCount(fullPath);
    
    result.children.push({
      name: path.basename(file, '.md'),
      path: fullPath,
      type: 'file',
      depth: depth + 1,
      size: fileSize.size,
      formattedSize: fileSize.formatted,
      wordCount: wordCount
    });
  });
  
  // 再处理目录（按字母顺序排序）
  directories.sort().forEach(directory => {
    const subdir = path.resolve(dir, directory);
    result.children.push(getDirectoryStructure(subdir, depth + 1));
  });
  
  return result;
}

/**
 * 计算目录中Markdown文件的数量
 * @param {string} dirPath 目录路径
 * @returns {number} Markdown文件数量
 */
function countMarkdownFiles(dirPath) {
  let count = 0;
  
  try {
    const list = fs.readdirSync(dirPath);
    
    list.forEach(file => {
      const fullPath = path.resolve(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        count += countMarkdownFiles(fullPath);
      } else if (path.extname(file) === '.md') {
        count++;
      }
    });
    
    return count;
  } catch (err) {
    return 0;
  }
}

/**
 * 生成根目录README内容
 * @param {Object} structure 目录结构
 * @param {string} basePath 基础路径
 * @returns {string} README内容
 */
function generateRootReadmeContent(structure, basePath) {
  let content = `# ${config.specifiedPath}\n\n`;
  
  // 查找指定路径目录
  const specifiedPathDir = structure.children.find(item => item.type === 'directory' && item.name === config.specifiedPath);
  
  if (specifiedPathDir) {
    // 生成四列表格，添加超链接
    content += '| 归类 | 书籍数量 | 预估字数 | 大小 |\n';
    content += '| --- | --- | --- | --- |\n';
    
    // 计算指定路径下的总书籍数、字数和大小
    const totalBookCount = countMarkdownFiles(specifiedPathDir.path);
    const totalWordCount = estimateDirectoryWordCount(specifiedPathDir.path);
    const totalSize = getDirectorySize(specifiedPathDir.path);
    
    // 添加指定路径的总信息，添加超链接到指定路径的README
    content += `| [${specifiedPathDir.name}](${config.specifiedPath}/README.md) | ${totalBookCount} | ${totalWordCount} 字 | ${totalSize.formatted} |\n`;
    
    // 添加指定路径下各子目录的信息，添加超链接到各子目录的README
    const subDirectories = specifiedPathDir.children.filter(item => item.type === 'directory');
    subDirectories.forEach(subDir => {
      const subDirBookCount = countMarkdownFiles(subDir.path);
      const subDirWordCount = estimateDirectoryWordCount(subDir.path);
      const subDirSize = getDirectorySize(subDir.path);
      
      content += `| [${subDir.name}](${config.specifiedPath}/${subDir.name}/README.md) | ${subDirBookCount} | ${subDirWordCount} 字 | ${subDirSize.formatted} |\n`;
    });
  }
  
  content += '\n---\n\n';
  content += '> 本README文件由系统自动生成，请勿手动修改。\n---';
  content += '**📞 聯繫資訊**\n\n';
  content += '如有任何問題或建議，歡迎通過以下方式聯繫：\n\n';
  content += '- 📧 微信: yeyang0802\n';
  content += '- 🐙 GitHub: [@yeyangchen2009](https://github.com/yeyangchen2009)\n\n';
  content += '![](/_media/lxfs.jpg)\n';
  content += '**📄 版權聲明**\n\n';
  content += '本項目僅供學習和研究使用，如需商業用途請聯繫相關版權方。\n';
  
  return content;
}

/**
 * 生成指定路径README内容（如"艺藏"目录）
 * @param {Object} structure 目录结构
 * @param {string} basePath 基础路径
 * @returns {string} README内容
 */
function generateSpecifiedPathReadmeContent(structure, basePath) {
  let content = `# ${structure.name}\n\n`;
  
  // 统计信息
  const fileCount = structure.children.filter(item => item.type === 'file').length;
  const dirCount = structure.children.filter(item => item.type === 'directory').length;
  
  content += `本目录包含 ${fileCount} 个文档文件和 ${dirCount} 个子目录。\n\n`;
  
  // 总览表格（四列：名称、书籍数、预估字数、大小）
  content += '## 总览\n\n';
  content += '| 名称 | 书籍数 | 预估字数 | 大小 |\n';
  content += '|------|--------|----------|------|\n';
  
  // 计算整个指定路径目录的统计信息
  const totalWordCount = estimateDirectoryWordCount(structure.path);
  const totalSize = getDirectorySize(structure.path);
  const totalBookCount = countMarkdownFiles(structure.path);
  
  content += `| ${structure.name} | ${totalBookCount} | ${totalWordCount} 字 | ${totalSize.formatted} |\n\n`;
  
  // 为每个子目录生成单独的表格
  const directories = structure.children.filter(item => item.type === 'directory');
  directories.forEach(dir => {
    content += `## ${dir.name}\n\n`;
    content += '| 文件名称 | 预估字数 | 大小 |\n';
    content += '|----------|----------|------|\n';
    
    // 获取子目录中的文件
    const subdirStructure = getDirectoryStructure(dir.path);
    const files = subdirStructure.children.filter(item => item.type === 'file');
    
    files.forEach(file => {
      content += `| [${file.name}](${path.relative(basePath, file.path).replace(/\\/g, '/')}) | ${file.wordCount} 字 | ${file.formattedSize} |\n`;
    });
    
    content += '\n';
  });
  
  content += '---\n\n';
  content += '> 本README文件由系统自动生成，请勿手动修改。\n';
  
  return content;
}

/**
 * 生成普通目录README内容
 * @param {Object} structure 目录结构
 * @param {string} basePath 基础路径
 * @returns {string} README内容
 */
function generateNormalReadmeContent(structure, basePath) {
  let content = `# ${structure.name}\n\n`;
  
  // 统计信息
  const fileCount = structure.children.filter(item => item.type === 'file').length;
  const dirCount = structure.children.filter(item => item.type === 'directory').length;
  
  content += `本目录包含 ${fileCount} 个文档文件和 ${dirCount} 个子目录。\n\n`;
  
  // 如果有文件，生成文件列表表格
  const files = structure.children.filter(item => item.type === 'file');
  if (files.length > 0) {
    content += '## 文件列表\n\n';
    content += '| 文件名称 | 预估字数 | 大小 |\n';
    content += '|---------|---------|------|\n';
    
    files.forEach(file => {
      content += `| [${file.name}](${path.relative(basePath, file.path).replace(/\\/g, '/')}) | ${file.wordCount} 字 | ${file.formattedSize} |\n`;
    });
    
    content += '\n';
  }
  
  // 如果有目录，生成目录列表
  const directories = structure.children.filter(item => item.type === 'directory');
  if (directories.length > 0) {
    content += '## 子目录\n\n';
    
    directories.forEach(dir => {
      content += `- [${dir.name}](${path.relative(basePath, dir.path).replace(/\\/g, '/')}/README.md)\n`;
    });
    
    content += '\n';
  }
  
  content += '---\n\n';
  content += '> 本README文件由系统自动生成，请勿手动修改。\n';
  
  return content;
}

/**
 * 生成根目录侧边栏内容
 * @param {Object} structure 目录结构
 * @param {string} basePath 基础路径
 * @returns {string} 侧边栏内容
 */
function generateRootSidebarContent(structure, basePath) {
  let content = '';
  
  // 根目录的readme作为首页
  content += '* [首页](README.md)\n';
  
  // 指定路径的readme
  const specifiedPathDir = structure.children.find(item => item.type === 'directory' && item.name === config.specifiedPath);
  if (specifiedPathDir) {
    content += `* [${config.specifiedPath}](${config.specifiedPath}/README.md)\n`;
    
    // 添加分隔线
    content += '\n---\n\n';
    
    // 添加指定路径下所有子目录的README链接
    const subDirectories = specifiedPathDir.children.filter(item => item.type === 'directory');
    subDirectories.forEach(subDir => {
      content += `* [${subDir.name}](${config.specifiedPath}/${subDir.name}/README.md)\n`;
    });
  }
  
  return content;
}

/**
 * 生成子目录侧边栏内容
 * @param {Object} structure 目录结构
 * @param {string} basePath 基础路径
 * @returns {string} 侧边栏内容
 */
function generateSubdirSidebarContent(structure, basePath) {
  let content = '';
  
  // 添加返回链接
  content += '* [返回根目录](../README.md)\n';
  content += '* [返回上一级](./README.md)\n';
  
  content += '\n---\n\n';
  
  // 处理文件
  const files = structure.children.filter(item => item.type === 'file');
  files.forEach(item => {
    const relativePath = path.relative(basePath, item.path).replace(/\\/g, '/');
    content += `* [${item.name}](${relativePath})\n`;
  });
  
  return content;
}

/**
 * 为每个目录生成README和侧边栏
 * @param {Object} structure 目录结构
 * @param {string} basePath 基础路径
 * @param {boolean} isRoot 是否为根目录
 */
function generateDocs(structure, basePath, isRoot = false) {
  // 生成README文件
  console.log(`Generating README for: ${structure.path}`);
  let readmeContent;
  
  if (isRoot) {
    // 根目录
    readmeContent = generateRootReadmeContent(structure, basePath);
  } else if (structure.name === config.specifiedPath) {
    // 指定路径目录（如"艺藏"）
    readmeContent = generateSpecifiedPathReadmeContent(structure, basePath);
  } else {
    // 普通子目录
    readmeContent = generateNormalReadmeContent(structure, basePath);
  }
  
  const readmePath = path.resolve(structure.path, 'README.md');
  fs.writeFileSync(readmePath, readmeContent, config.encoding);
  console.log(`Created: ${readmePath}`);
  
  // 生成侧边栏文件（指定路径不生成）
  if (structure.name !== config.specifiedPath) {
    console.log(`Generating sidebar for: ${structure.path}`);
    let sidebarContent;
    
    if (isRoot) {
      // 根目录
      sidebarContent = generateRootSidebarContent(structure, basePath);
    } else {
      // 子目录
      sidebarContent = generateSubdirSidebarContent(structure, basePath);
    }
    
    const sidebarPath = path.resolve(structure.path, '_sidebar.md');
    fs.writeFileSync(sidebarPath, sidebarContent, config.encoding);
    console.log(`Created: ${sidebarPath}`);
  }
  
  // 递归处理子目录
  structure.children.forEach(item => {
    if (item.type === 'directory') {
      generateDocs(item, basePath, false); // 子目录都不是根目录
    }
  });
}

// 主函数
function main() {
  const targetDir = path.resolve(rootDir);
  
  console.log(`Starting to generate docs from: ${targetDir}`);
  
  // 检查目标目录是否存在
  if (!fs.existsSync(targetDir)) {
    console.error(`Target directory does not exist: ${targetDir}`);
    process.exit(1);
  }
  
  // 获取目录结构
  const structure = getDirectoryStructure(targetDir);
  
  // 生成文档
  generateDocs(structure, targetDir, true); // 第一个参数是根目录
  
  console.log('Document generation completed.');
}

// 运行主函数
main();