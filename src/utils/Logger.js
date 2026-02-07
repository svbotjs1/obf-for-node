import chalk from 'chalk';
export class Logger {
  static log(m) { console.log(chalk.blue(m)); }
  static success(m) { console.log(chalk.green(m)); }
  static error(m) { console.log(chalk.red(m)); }
}