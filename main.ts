import { App, Plugin, TFile, Notice, MarkdownPostProcessorContext } from 'obsidian';

export default class BirdFocusPlugin extends Plugin {
    private timerInterval: any = null;
    private elapsedSeconds: number = 0;
    private totalSeconds: number = 0;
    private isPaused: boolean = true;
    private visitors: any[] = [];
    private currentTaskName: string = "";
    private activeRefreshUI: Function | null = null;

    async onload() {
        this.registerMarkdownCodeBlockProcessor("birdie-focus", (source, el, ctx) => {
            this.renderBirdTimer(source, el, ctx);
        });
    }

    async renderBirdTimer(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        const lines = source.split('\n');
        let taskName = "無題の作業";
        let goalMinutes = 25;
        lines.forEach(line => {
            if (line.startsWith('task:')) taskName = line.split(':')[1].trim();
            if (line.startsWith('goal:')) goalMinutes = parseInt(line.split(':')[1]) || 25;
        });

        // 状態の同期
        if (this.isPaused) {
            this.currentTaskName = taskName;
            this.totalSeconds = goalMinutes * 60;
        }

        const container = el.createDiv({ cls: "bird-timer-container" });
        
        // --- 修正箇所: 現在のタスク名を表示 ---
        container.createEl("p", { 
            text: `現在実行中のタスク: ${this.currentTaskName}`,
            attr: { style: "font-weight: bold; margin-bottom: -10px; opacity: 0.8;" }
        });

        const remaining = this.totalSeconds - this.elapsedSeconds;
        const timerDisplay = container.createEl("h2", { text: this.formatTime(remaining) });
        
        const buttonGroup = container.createDiv();
        const startBtn = buttonGroup.createEl("button", { text: this.isPaused ? "開始" : "計測中..." });
        const pauseBtn = buttonGroup.createEl("button", { text: "一時停止" });
        const logArea = container.createDiv({ cls: "bird-log", text: this.visitors.length > 0 ? `最新: ${this.visitors[this.visitors.length-1].name}` : "待機中..." });

        const refreshUI = () => {
            const rem = this.totalSeconds - this.elapsedSeconds;
            timerDisplay.setText(this.formatTime(rem));
            if (rem <= 0 && !this.isPaused) {
                this.stopTimer();
                this.renderResult(container, this.visitors, this.currentTaskName, this.elapsedSeconds, el, ctx);
            }
        };

        startBtn.onclick = () => {
            if (this.isPaused) {
                this.isPaused = false;
                startBtn.setText("計測中...");
                this.startTimer(logArea, refreshUI);
            }
        };

        pauseBtn.onclick = () => {
            this.isPaused = true;
            startBtn.setText("再開");
            this.stopTimer();
        };

        const stopBtn = buttonGroup.createEl("button", { text: "終了して保存" });
        stopBtn.onclick = () => {
            this.stopTimer();
            this.renderResult(container, this.visitors, this.currentTaskName, this.elapsedSeconds, el, ctx);
            this.resetState();
        };

        if (!this.isPaused) {
            this.activeRefreshUI = refreshUI;
        }
    }

    private startTimer(logArea: HTMLElement, refreshUI: Function) {
        this.activeRefreshUI = refreshUI;
        if (this.timerInterval) window.clearInterval(this.timerInterval);
        
        this.timerInterval = window.setInterval(() => {
            this.elapsedSeconds++;
            if (this.activeRefreshUI) this.activeRefreshUI();
            if (this.elapsedSeconds > 0 && this.elapsedSeconds % 240 === 0) {
                this.tryInviteBird(logArea);
            }
        }, 1000);
    }

    private stopTimer() {
        if (this.timerInterval) {
            window.clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    private resetState() {
        this.elapsedSeconds = 0;
        this.visitors = [];
        this.isPaused = true;
        this.activeRefreshUI = null;
        this.currentTaskName = "";
    }

    formatTime(seconds: number): string {
        const absSec = Math.abs(seconds);
        const h = Math.floor(absSec / 3600).toString().padStart(2, '0');
        const m = Math.floor((absSec % 3600) / 60).toString().padStart(2, '0');
        const s = (absSec % 60).toString().padStart(2, '0');
        return `${seconds < 0 ? "-" : ""}${h}:${m}:${s}`;
    }

    async tryInviteBird(logArea: HTMLElement) {
        if (Math.random() < 0.7) {
            const birdFiles = this.app.vault.getFiles().filter(f => f.path.startsWith("Birds/"));
            if (birdFiles.length === 0) return;
            const birdFile = birdFiles[Math.floor(Math.random() * birdFiles.length)];
            
            await this.app.fileManager.processFrontMatter(birdFile, (fm) => {
                const emoji = fm.emoji || "🕊️";
                const reactions = fm.reactions || ["じっとしています"];
                const reaction = reactions[Math.floor(Math.random() * reactions.length)];
                const visitor = { name: birdFile.basename, emoji: emoji, reaction: reaction };
                this.visitors.push(visitor);
                new Notice(`${emoji} ${visitor.name}が${reaction}`);
                if (logArea) logArea.setText(`最新の訪問者: ${emoji} ${visitor.name} (${reaction})`);
            });
        }
    }

    async renderResult(container: HTMLElement, visitors: any[], taskName: string, elapsedSeconds: number, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        container.empty();
        const finalMinutes = Math.floor(elapsedSeconds / 60);
        const finalSeconds = elapsedSeconds % 60;
        const timeString = finalMinutes > 0 ? `${finalMinutes}分${finalSeconds}秒` : `${finalSeconds}秒`;
        const birdNames = visitors.length > 0 ? [...new Set(visitors.map(v => v.name))].join(", ") : "なし";
        
        const resultText = `\n### 🐦 作業ログ: ${taskName}\n- **実施日**: ${new Date().toLocaleString()}\n- **作業時間**: ${timeString}\n- **訪問者**: ${birdNames}\n\n---`;

        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
            const content = await this.app.vault.read(activeFile);
            const section = ctx.getSectionInfo(el);
            if (section) {
                const lines = content.split('\n');
                lines.splice(section.lineStart, section.lineEnd - section.lineStart + 1, resultText);
                await this.app.vault.modify(activeFile, lines.join('\n'));
                new Notice("作業ログを保存しました。");
            }
        }

        container.createEl("h3", { text: "本日の訪問記録" });
        if (visitors.length > 0) {
            const uniqueNames = [...new Set(visitors.map(v => v.name))];
            uniqueNames.forEach(name => {
                const info = visitors.find(v => v.name === name);
                const birdDiv = container.createDiv();
                birdDiv.createSpan({ text: `${info.emoji} ${name} ` });
                const snackBtn = birdDiv.createEl("button", { text: "おやつをあげる" });
                snackBtn.onclick = async () => {
                    await this.incrementFriendship(name);
                    const file = this.app.vault.getAbstractFileByPath(`Birds/${name}.md`);
                    if (file instanceof TFile) {
                        const date = new Date().toLocaleString();
                        await this.app.vault.append(file, `\n- ${date}: [${taskName}] の作業中に遊びに来た`);
                    }
                    snackBtn.setText("ありがとう！");
                    snackBtn.disabled = true;
                };
            });
        }
    }

    async incrementFriendship(birdName: string) {
        const file = this.app.vault.getAbstractFileByPath(`Birds/${birdName}.md`);
        if (file instanceof TFile) {
            await this.app.fileManager.processFrontMatter(file, (fm) => {
                fm["friendship"] = (fm["friendship"] || 0) + 1;
            });
        }
    }
}