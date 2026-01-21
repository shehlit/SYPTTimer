const segments = [
    { duration: 2, description: "Reporter prepares presentation" },
    { duration: 10, description: "Reporter presents" },
    { duration: 2, description: "Opponent questions reporter" },
    { duration: 4, description: "Opponent prepares presentation" },
    { duration: 12, description: "Opponent leads discussion with reporter" },
    { duration: 1, description: "Opponent summarises" },
    { duration: 1, description: "Reporter concludes" },
    { duration: 10, description: "Jurors question" },
    { duration: 5, description: "Juror write comments and scores" },
    { duration: 5, description: "Open scoring, comments and feedback" }
]

const alarm = document.getElementById("alarmSound");
const track = document.getElementById("timerContainer");
let currentIndex = 0;
const timers = [];

class Timer {
    constructor(segment, index) {
        this.duration = segment.duration * 60;
        this.timeLeft = this.duration;
        this.index = index;
        this.description = segment.description;
        this.interval = null;
        this.isPaused = false;
        this.isComplete = false;

        this.element = this.createTimerElement();
        this.timeDisplay = this.element.querySelector(".time");
        this.subTimerDisplay = this.element.querySelector(".sub-timer");
        this.progress = this.element.querySelector(".progress");
        this.startBtn = this.element.querySelector(".startBtn");
        this.pauseBtn = this.element.querySelector(".pauseBtn");
        this.resetBtn = this.element.querySelector(".resetBtn");

        // 5-minute engagement window only for Segment 5 (index 4)
        if (this.index === 4) {
            this.subDuration = 5 * 60;
            this.subTimeLeft = this.subDuration;
            this.subExpired = false;
        }

        this.updateDisplay();
        this.updateButtons("initial");
    }

    createTimerElement() {
        const div = document.createElement("div");
        const durationMins = this.duration / 60;
        const minuteLabel = durationMins <= 1 ? "minute" : "minutes";

        div.className = "timer-segment";
        div.innerHTML = `
        <div class="segment-title">Segment ${this.index + 1}: ${this.description}</div>
        <div class="segment-subtitle">${durationMins} ${minuteLabel}</div>
        <div class="time">00:00</div>
        <div class="sub-timer"></div>
        <div class="progress-bar">
            <div class="progress"></div>
        </div>
        <div class="controls">
            <button class="startBtn">Start</button>
            <button class="pauseBtn">Pause</button>
            <button class="resetBtn">Reset</button>
        </div>
        `;

        div.querySelector(".startBtn").addEventListener("click", () => this.start());
        div.querySelector(".pauseBtn").addEventListener("click", () => this.pause());
        div.querySelector(".resetBtn").addEventListener("click", () => this.reset());

        return div;
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    
        const progressPercent = ((this.duration - this.timeLeft) / this.duration) * 100;
        this.progress.style.width = `${progressPercent}%`;
    
        if (this.timeLeft > 0 && this.timeLeft <= 10) {
            this.timeDisplay.classList.add("flash-warning");
        } else {
            this.timeDisplay.classList.remove("flash-warning");
        }

        // sub-timer: only for Segment 5
        if (this.index === 4 && this.subTimerDisplay) {
            if (!this.subExpired && this.subTimeLeft > 0) {
                const subMin = Math.floor(this.subTimeLeft / 60);
                const subSec = this.subTimeLeft % 60;
                this.subTimerDisplay.textContent =
                    `Opponent must engage Reporter within: ${String(subMin).padStart(2, "0")}:${String(subSec).padStart(2, "0")}`;
                this.subTimerDisplay.classList.remove("expired");
            } else if (!this.subExpired && this.subTimeLeft <= 0) {
                this.subExpired = true;
                this.subTimeLeft = 0;
                this.subTimerDisplay.textContent =
                    "5-minute window over (Reporter should already be engaged)";
                this.subTimerDisplay.classList.add("expired");
            }
        }
    }
    

    updateButtons(state) {
        const show = (btn) => btn.style.display = 'inline-block';
        const hide = (btn) => btn.style.display = 'none';

        switch (state) {
            case 'initial':
                show(this.startBtn);
                hide(this.pauseBtn);
                hide(this.resetBtn);
                break;
            case 'running':
                hide(this.startBtn);
                this.pauseBtn.textContent = 'Pause';
                show(this.pauseBtn);
                show(this.resetBtn);
                break;
            case 'paused':
                hide(this.startBtn);
                this.pauseBtn.textContent = 'Resume';
                show(this.pauseBtn);
                show(this.resetBtn);
                break;
            case 'complete':
                hide(this.startBtn);
                hide(this.pauseBtn);
                show(this.resetBtn);
                break;
        }
    }

    start() {
        if (this.interval || this.isComplete) return;
        this.interval = setInterval(() => {
            if (this.timeLeft <= 0) {
                this.complete();
                return;
            }
            this.timeLeft--;

            // handle sub-timer countdown only for Segment 5
            if (this.index === 4 && this.subTimeLeft > 0) {
                this.subTimeLeft--;
            }

            this.updateDisplay();
        }, 1000);
        this.isPaused = false;
        this.updateButtons("running");
    }

    pause() {
        if(this.interval){
            clearInterval(this.interval);
            this.interval = null;
            this.isPaused = true;
            this.updateButtons("paused");
        } else if (this.isPaused && !this.isComplete){
            this.start();
        }
    }

    reset() {
        clearInterval(this.interval);
        this.interval = null;
        this.timeLeft = this.duration;
        this.isPaused = false;
        this.isComplete = false;
        
        if (this.index === 4) {
            this.subTimeLeft = this.subDuration;
            this.subExpired = false;
            if (this.subTimerDisplay) {
                this.subTimerDisplay.textContent = "";
                this.subTimerDisplay.classList.remove("expired");
            }
        }
        
        this.updateDisplay();
        this.progress.style.width = "0%";
        this.element.classList.remove("complete");
        this.updateButtons("initial");
        alarm.pause();
        alarm.currentTime = 0;
        this.timeDisplay.classList.remove("flash-warning");
    }

    complete() {
        if (this.isComplete) return;
        this.isComplete = true;
        clearInterval(this.interval);
        this.interval = null;
        this.timeLeft = 0;
        this.updateDisplay();
        this.updateButtons("complete");
        alarm.currentTime = 0;
        alarm.play().catch(() => {});
        this.timeDisplay.classList.remove("flash-warning");
    }
}

timers.forEach((timer, i) => {
    timer.element.style.animationDelay = `${i * 0.15}s`;
})

segments.forEach((segment, i) => {
    const timer = new Timer(segment, i);
    timers.push(timer);
    track.appendChild(timer.element)
})

function updateCarousel() {
    const children = Array.from(track.children);
    children.forEach((child, i) => {
        child.style.display = i === currentIndex ? "block" : "none";
    });

    document.getElementById("prevBtn").disabled = (currentIndex === 0);
    document.getElementById("nextBtn").disabled = (currentIndex === segments.length - 1);
}

document.getElementById("prevBtn").addEventListener("click", () => {
    if(currentIndex > 0) {
        currentIndex--;
        updateCarousel();
    }
});

document.getElementById("nextBtn").addEventListener("click", () => {
    if(currentIndex < timers.length - 1) {
        currentIndex++;
        updateCarousel();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
        document.getElementById("prevBtn").click();
    } else if (e.key === "ArrowRight") {
        document.getElementById("nextBtn").click();
    } else if (e.key === " ") { // space: start/pause current
        e.preventDefault();
        const t = timers[currentIndex];
        if (!t) return;
        if (t.interval) t.pause();
        else t.start();
    } else if (e.key === "r" || e.key === "R") {
        const t = timers[currentIndex];
        if (t) t.reset();
    }
});

updateCarousel();
