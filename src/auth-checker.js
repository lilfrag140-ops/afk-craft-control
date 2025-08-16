import pkg from 'prismarine-auth';
const { Authflow, Titles } = pkg;
import chalk from 'chalk';

export class AuthChecker {
  constructor() {
    this.results = {
      working: [],
      failed: [],
      invalidFormat: []
    };
  }

  async validateAccount(email, password) {
    try {
      console.log(chalk.cyan(`🔍 Validating ${email}...`));
      
      // Create temporary cache directory for this validation
      const cacheDir = `.auth_cache_${Date.now()}`;
      
      const authflow = new Authflow(email, cacheDir, {
        authTitle: Titles.MinecraftJavaEdition,
        deviceType: 'raw',
        flow: 'sisu',
        relyingParty: 'https://pocket.realms.minecraft.net/',
        authTitle: '00000000-0000-0000-0000-000000000000'
      });

      // Try to authenticate using the simpler sisu flow
      const auth = await authflow.getMinecraftJavaToken();

      if (auth && auth.token) {
        console.log(chalk.green(`✅ ${email} - Valid`));
        this.results.working.push(`${email}:${password}`);
        return true;
      } else {
        console.log(chalk.red(`❌ ${email} - Invalid credentials`));
        this.results.failed.push(`${email}:${password}`);
        return false;
      }
    } catch (error) {
      console.log(chalk.red(`❌ ${email} - Failed: ${error.message}`));
      this.results.failed.push(`${email}:${password}`);
      return false;
    }
  }

  async checkAccountList(accounts) {
    console.log(chalk.blue('🔄 Validating accounts using Microsoft authentication...'));
    console.log(chalk.gray('This method is faster and doesn\'t require joining servers.'));
    console.log('');

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      console.log(chalk.cyan(`[${i + 1}/${accounts.length}]`));
      
      await this.validateAccount(account.email, account.password);
      
      // Small delay to avoid rate limiting
      if (i < accounts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.printResults();
    return this.results;
  }

  printResults() {
    console.log('');
    console.log(chalk.blue('📊 Authentication Results:'));
    console.log(`✅ Valid accounts: ${chalk.green(this.results.working.length)}`);
    console.log(`❌ Invalid accounts: ${chalk.red(this.results.failed.length)}`);
    console.log(`⚠️ Format errors: ${chalk.yellow(this.results.invalidFormat.length)}`);
  }

  async saveResults() {
    const fs = await import('fs');
    
    if (this.results.working.length > 0) {
      fs.writeFileSync('valid_accounts.txt', this.results.working.join('\n'));
      console.log(chalk.green('💾 Valid accounts saved to valid_accounts.txt'));
    }
    
    if (this.results.failed.length > 0) {
      fs.writeFileSync('invalid_accounts.txt', this.results.failed.join('\n'));
      console.log(chalk.red('💾 Invalid accounts saved to invalid_accounts.txt'));
    }
  }
}