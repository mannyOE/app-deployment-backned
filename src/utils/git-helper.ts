import simpleGit, { SimpleGit } from 'simple-git';
const username = require('git-username');
import { existsSync } from 'fs';

class GitHelper {
  public remoteName: string;
  public git: SimpleGit;
  public projectPath: string;
  public provider: string;
  public url: string;
  public token: string;
  public user: string;

  constructor (
    url: string, 
    projectPath: string, 
    token: string, 
    provider: string
  ) {
    this.remoteName = 'origin';
    this.git = simpleGit();
    this.projectPath = projectPath;
    this.provider = provider;
    this.url = url;
    this.token = token;
    this.user = username(this.url);
  }

  async clone() {
    if (this.provider === 'github')
      await this.git.clone(`https://${this.user}:${this.token}@${this.url.split('//')[1]}`, this.projectPath);
    else if (this.provider === 'gitlab')
      await this.git.clone(`https://oauth2:${this.token}@${this.url.split('//')[1]}`, this.projectPath);
    else if (this.provider === 'bitbucket')
      await this.git.clone(`https://x-token-auth:${this.token}@${this.url.split('//')[1]}`, this.projectPath);
    
    await this.git.cwd(this.projectPath);
  }

  async pull() {
    try {
      await this.git.pull(this.remoteName, 'master-zeedas');
    } catch(err) {
      throw new Error(err.message);
    }
  }

  async switchToBaseBranch(base: string) {
    const { current } = await this.git.branch();
    if (current !== base)
      await this.git.checkout(base);
  }

  setRemote() {
    try {
      // @ts-ignore
      this.git.getRemotes((err: any, remotes: any) => {
        if (!err && !remotes.map((remote: any) => remote.name).includes(this.remoteName)) {
          return this.git.addRemote(
            this.remoteName,
            this.url
          );
        }
      })
    } catch (ex) {
      throw new Error(ex.message);
    }
  }

  async switchBranch(name: string) {
    const { branches, current } = await this.git.branch();
    if (current === name) return Promise.resolve();

    const { files } = await this.git.status();
    if (files.length > 0) {
      // @ts-ignore
      await this.git.reset('hard');
    }
    const found = Object.keys(branches).find(
      branch => branch.includes(name)
    )
    await this.git.checkoutLocalBranch(name);
    found
      ? await this.git.checkout(found)
      : await this.git.checkoutLocalBranch(name)
  }

  async commit(message: any) {
    try {
      await this.git.cwd(this.projectPath);
      await this.git.add('./*');
      await this.git.commit([message, '--allow-empty']);
    } catch (ex) {
      
      throw new Error(ex.message)
    }
  }

  async push(branch: string) {
    try {
      await this.git.push([this.remoteName, '-u', branch, '--force']);
    } catch (ex) {
      throw new Error(ex.message);
    }
  }

  async update(branch: string, message: string) {
    try {
      await this.commit(message);
      await this.git.fetch();
      await this.pull();
      await this.push(branch);
    } catch (ex) {
      throw new Error(ex.message);
    }
  }

  async deleteBranch (branch: string) {
    try {
      await this.git.deleteLocalBranch(branch, true);
    } catch (ex) {
      throw new Error(ex.message);
    }
  }
}

export default GitHelper;
