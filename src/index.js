#!/usr/bin/env node


const fse = require('fs-extra')
const inquirer = require('inquirer')
const path = require('path')
let delName = 'node_modules'
const ora = require('ora')
const slog = require('single-line-log').stdout
const fuzzy = require('fuzzy')

inquirer.registerPrompt('suggest', require('inquirer-prompt-suggest'))

const delNames = [
    'node_modules',
    'dist',
    'logs',
    'src',
    'test',
    'demo'
]


async function init( currentDirPath ) {
    let exists = fse.statSync(currentDirPath)
    if (exists) {
        const spinner = ora('读取要删除的文件夹').start()
        let filesList = []
        readFilesList(currentDirPath, filesList)
        let total = filesList.length;
        spinner.succeed(`共读取到${total}个需要删除`)
        if (total > 0) {
            const pb = new ProgressBar()
            let num = 0
            pb.render({ completed: num, total })
            let promises = filesList.map(fileP => removeDir(fileP, () => {
                num++
                pb.render({ completed: num, total })
                if (num === total) {
                    spinner.succeed(`文件删除成功`)
                    process.exit(1)
                }
            }))
            runPromiseByQueue(promises)
        } else {
            process.exit(1)
        }
    } else {
        console.error('输入地址有误')
    }
}

async function runPromiseByQueue(promises) {
    for (let value of promises) {
        await value
    }
}

function removeDir(p, cb) {
    return new Promise((resolve, reject) => {
        fse.remove( p, err => {
            if (err) {
                console.error(err)
                reject(err)
            } else {
                cb && cb(p)
                resolve()
            }
        })
    })
}

// 封装的 ProgressBar 工具
function ProgressBar(description, bar_length){
    // 两个基本参数(属性)
    this.description = description || '文件删除进度';    // 命令行开头的文字信息
    this.length = bar_length || 50;           // 进度条的长度(单位：字符)，默认设为 25
    
    // 刷新进度条图案、文字的方法
    this.render = function (opts) {
        let percent = (opts.completed / opts.total).toFixed(4)
        let cell_num = Math.floor(percent * this.length);       // 计算需要多少个 █ 符号来拼凑图案
        // 拼接黑色条
        let cell = '';
        for (let i=0;i < cell_num; i++) {
            cell += '█';
        }
        // 拼接灰色条
        let empty = '';
        for (let i=0; i< this.length - cell_num; i++) {
            empty += '░';
        }
        // 拼接最终文本
        const cmdText = this.description + ': ' + cell + empty + ' ' + opts.completed + '/' + opts.total;
        // 在单行输出文本
        slog(cmdText);
    }
}



function readFilesList(currentDirPath, filesList) {
    try {
        const files = fse.readdirSync(currentDirPath)
        files && files.forEach(name => {
            const filePath = path.join(currentDirPath, name)
            const stat = fse.statSync(filePath)
            if (stat.isDirectory()) {
                if (name === delName) {
                    filesList.push(filePath)
                } else {
                    readFilesList(filePath,filesList)
                }
            }
        })
    } catch (err) {
        console.error(err)
        process.exit(0)
    }
}

function question() {
    inquirer
    .prompt([ 
        {
            type: 'suggest',
            message: `请选择要删除的文件名称（默认为${delName}）`,
            name: 'name',
            suggestions: delNames
        },
        {
            type: 'input',
            message: `请输入要删除哪个文件夹下的文件（绝对路径）`,
            name: 'path'
        }
    ]).then(answers => {
         delName = answers.name || delName
        if (answers.path) {
            init(answers.path.trim())
        } else {
            console.log('请输入地址')
        }
    }).catch(error => {
        if(error.isTtyError) {
            console.log('脚本异常')
          } else {
            // Something else went wrong
          }
    })
}

question()
// '/Users/zhangchenguang/业余/delNodeModules/test11'
