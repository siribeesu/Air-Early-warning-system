import { gsap } from 'gsap';

// Sound Synthesis
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playWhoosh() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
}

function playPop() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

const timeline = gsap.timeline({ paused: true });

function initVideo() {
    // Labels
    timeline.addLabel("scene1", 0);
    timeline.addLabel("scene2", 3);
    timeline.addLabel("scene3", 10);
    timeline.addLabel("scene4", 20);
    timeline.addLabel("scene5", 30);
    timeline.addLabel("scene6", 40);
    timeline.addLabel("scene7", 50);

    // S1: 0-3s
    timeline.call(playWhoosh, null, "scene1");
    timeline.to("#scene-1", { autoAlpha: 1, duration: 0.5 }, "scene1");
    timeline.from("#scene-1 h1", { scale: 0.2, opacity: 0, duration: 1, ease: "back.out(1.7)" }, "scene1+=0.2");
    timeline.from("#scene-1 p", { y: 30, opacity: 0, duration: 0.8 }, "scene1+=0.8");
    timeline.to("#scene-1", { autoAlpha: 0, duration: 0.3 }, "scene2-=0.3");

    // S2: 3-10s
    timeline.to("#scene-2", { autoAlpha: 1, duration: 0.5 }, "scene2");
    timeline.from(".git-github-split .label", { y: 20, opacity: 0, stagger: 1, duration: 0.5 }, "scene2+=0.5");
    timeline.call(playPop, null, "scene2+=3");
    timeline.to("#big-x", { opacity: 1, scale: 2, duration: 0.3, rotate: 15, ease: "bounce" }, "scene2+=3");
    timeline.to("#scene-2", { x: 4, duration: 0.05, repeat: 10, yoyo: true }, "scene2+=3.5");
    timeline.to("#scene-2", { autoAlpha: 0, duration: 0.3 }, "scene3-=0.3");

    // S3: 10-20s
    timeline.to("#scene-3", { autoAlpha: 1, duration: 0.5 }, "scene3");
    timeline.from("#scene-3 .icon", { scale: 0, opacity: 0, duration: 1, ease: "elastic" }, "scene3+=0.5");
    timeline.from("#scene-3 .version-item", { x: -30, opacity: 0, stagger: 0.4, duration: 0.6, onStart: playPop }, "scene3+=2");
    timeline.to("#scene-3", { filter: "blur(20px)", opacity: 0, duration: 0.8, ease: "power2.in" }, "scene4-=0.8");

    // S4: 20-30s
    timeline.to("#scene-4", { autoAlpha: 1, duration: 0.5 }, "scene4");
    timeline.from("#scene-4 .icon", { y: 100, opacity: 0, duration: 1 }, "scene4+=0.5");
    timeline.from("#scene-4 .user-icon", { y: 20, opacity: 0, stagger: 0.2, duration: 0.4, onStart: playPop }, "scene4+=1.5");
    timeline.to(".feat", { opacity: 1, y: -5, stagger: 0.8, duration: 0.5, onStart: playWhoosh }, "scene4+=2.5");
    timeline.to("#scene-4", { scale: 0.8, opacity: 0, duration: 0.5 }, "scene5-=0.5");

    // S5: 30-40s
    timeline.to("#scene-5", { autoAlpha: 1, duration: 0.5 }, "scene5");
    timeline.from(".split-left", { xPercent: -100, duration: 0.8 }, "scene5+=0.5");
    timeline.from(".split-right", { xPercent: 100, duration: 0.8 }, "scene5+=0.5");
    timeline.from("#center-arrow", { scale: 0, opacity: 0, duration: 0.5, onStart: playWhoosh }, "scene5+=1.5");
    timeline.to("#scene-5", { autoAlpha: 0, duration: 0.5 }, "scene6-=0.5");

    // S6: 40-50s
    timeline.to("#scene-6", { autoAlpha: 1, duration: 0.5 }, "scene6");
    timeline.from(".f-icon", { x: -50, opacity: 0, stagger: 0.5, duration: 0.8, onStart: playPop }, "scene6+=0.5");
    timeline.from("#flow-text", { opacity: 0, scale: 0.9, duration: 1 }, "scene6+=2.5");
    timeline.to("#scene-6", { autoAlpha: 0, duration: 0.3 }, "scene7-=0.3");

    // S7: 50-60s
    timeline.to("#scene-7", { autoAlpha: 1, duration: 0.5 }, "scene7");
    timeline.from("#scene-7 p", { y: 20, opacity: 0, stagger: 1, duration: 0.8 }, "scene7+=1");
    timeline.from("#scene-7 h2", { scale: 0.5, opacity: 0, duration: 1, ease: "back", onStart: playWhoosh }, "scene7+=4");
}

document.getElementById('play-overlay').addEventListener('click', () => {
    document.getElementById('play-overlay').style.display = 'none';
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    timeline.play(0);
});

initVideo();
