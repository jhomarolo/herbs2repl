/* eslint-disable no-console */

const inquirer = require('inquirer')
const chalk = require('chalk')
const gradient = require('gradient-string')

async function list(usecases, groupBy) {

    let ucs = usecases.map((uc) => {
        return {
            name: uc.tags[groupBy] + ' - ' + uc.usecase.description,
            value: uc.usecase
        }
    })

    const answers = await inquirer
        .prompt([
            {
                type: 'list',
                name: 'usecase',
                message: 'Choose a use case',
                choices: ucs,
                loop: false
            }
        ])
    return answers.usecase
}

function printDoc(uc) {

    function printStep(step, level = 1, print = true) {
        const IF_ELSE = 'if else'
        const spaces = '  '.repeat(level)
        const bullet = chalk.grey('-')
        if (print) console.log(`${spaces} ${bullet} ${step.description}`)
        if (step.type === IF_ELSE) return printIfElseStep(step, level + 1)
        printSubSteps(step, level)
    }

    function printIfElseStep(step, level = 1) {
        const spaces = '  '.repeat(level)
        const style = chalk.grey
        const ifThenElse = [
            { desc: style('if -'), step: step.if },
            { desc: style('then -'), step: step.then },
            { desc: style('else -'), step: step.else },
        ]
        for (const item of ifThenElse) {
            console.log(`${spaces} ${item.desc} ${item.step.description}`)
            printStep(item.step, level + 1, false)
        }
    }

    function printSubSteps(step, level) {
        if (step.steps)
            for (const s of step.steps) {
                printStep(s, level + 1)
            }
    }

    const doc = uc.doc()
    const style = chalk.blue.underline
    console.log(`\n${style(doc.description)} use case will execute the following steps:`)
    for (const step of doc.steps) { printStep(step) }
}

async function execute(usecase, user) {

    console.log(`\nInform the parameters for the use case execution`)

    const params = usecase.requestSchema

    const questions = []
    for (const param of Object.entries(params)) {
        const desc = param[0]
        const type = param[1]
        const questionTypes = {
            'Number': 'number',
            'Boolean': 'confirm',
            'default': 'input',
        }
        const questionType = questionTypes[type.name] || questionTypes['default']
        questions.push({
            type: questionType,
            name: desc,
            message: `${desc} (${type.name})`,
        })
    }

    const answers = await inquirer.prompt(questions)
    console.log(chalk`\n{whiteBright.bold Params:}`)
    console.log(chalk.blue(JSON.stringify(answers, null, ' ')))

    const hasAccess = usecase.authorize(user)
    if (!hasAccess) return console.log(chalk`\n{redBright.bold Access denied}`)

    const result = await usecase.run(answers)
    console.log(chalk`\n{whiteBright.bold Result:}`)

    let style = result.isOk ? chalk.green : chalk.red
    console.log(style(JSON.stringify(result, null, ' ')))

}

async function repl(usecases, user, { groupBy }) {
    let coolGradient = gradient('gold', 'white')
    console.log(chalk.bold(coolGradient('\nHerbs - Interative REPL')))
    console.log(chalk.dim('press ^C to exit\n'))

    while (true) {
        const usecase = await list(usecases, groupBy)
        printDoc(usecase)
        await execute(usecase, user)
        console.log('')
    }
}

module.exports = repl