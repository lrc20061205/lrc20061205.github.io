// player.js
const sound = new Howl({
  src: ['bgm.m4a'], // 替换为你的音频
  html5: true, // 重要：支持精确 seek
  
  onload: function() {
    document.getElementById('status').textContent = '已加载';
    updateTotalTime();
    // 显示缓冲进度
    updateBuffer();
  },
  
  onplay: function() {
    document.getElementById('status').textContent = '播放中';
    startProgressUpdate();
  },
  
  onpause: function() {
    document.getElementById('status').textContent = '已暂停';
    stopProgressUpdate();
  },
  
  onstop: function() {
    document.getElementById('status').textContent = '已停止';
    stopProgressUpdate();
    resetProgress();
  },
  
  onend: function() {
    document.getElementById('status').textContent = '播放结束';
    stopProgressUpdate();
    // 确保进度条到 100%
    updateProgressBar(1);
  },
  
  onloaderror: function(id, error) {
    console.error('加载失败:', error);
    document.getElementById('status').textContent = '? 加载失败';
  }
});

// ============ DOM 元素 ============
const playBtn = document.getElementById('playBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressThumb = document.getElementById('progressThumb');
const progressBuffer = document.getElementById('progressBuffer');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');

// ============ 状态变量 ============
let progressInterval = null;
let isDragging = false;
let animationFrameId = null;

// ============ 工具函数 ============
function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// 更新进度条（核心）
function updateProgressBar(percent) {
  const clampedPercent = Math.min(Math.max(percent, 0), 1);
  progressBar.style.width = `${clampedPercent * 100}%`;
  // 圆形图标会自动跟随，因为它在 .progress-bar 内部
}

// 重置进度
function resetProgress() {
  updateProgressBar(0);
  currentTimeEl.textContent = '00:00';
}

// ============ 进度更新 ============
function updateProgress() {
  const seek = sound.seek() || 0;
  const duration = sound.duration() || 0;
  
  if (duration > 0) {
    const percent = seek / duration;
    updateProgressBar(percent);
    currentTimeEl.textContent = formatTime(seek);
  }
}

// 更新缓冲进度（可选功能）
function updateBuffer() {
  // 注意：howler.js 没有直接提供缓冲进度 API
  // 这里用模拟或通过 HTML5 Audio 获取
  if (sound._audioNode) {
    // 尝试获取缓冲信息（仅当使用 HTML5 Audio 时）
    try {
      const audio = sound._audioNode;
      if (audio && audio.buffered && audio.buffered.length > 0) {
        const buffered = audio.buffered.end(audio.buffered.length - 1);
        const duration = sound.duration();
        if (duration > 0) {
          const bufferPercent = buffered / duration;
          progressBuffer.style.width = `${Math.min(bufferPercent * 100, 100)}%`;
        }
      }
    } catch (e) {
      // 忽略错误
    }
  }
}

// ============ 自动更新控制 ============
function startProgressUpdate() {
  stopProgressUpdate();
  
  // 使用 requestAnimationFrame 更流畅
  function updateLoop() {
    if (!isDragging) {
      updateProgress();
      // 可选：更新缓冲
      updateBuffer();
    }
    animationFrameId = requestAnimationFrame(updateLoop);
  }
  updateLoop();
}

function stopProgressUpdate() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

// 更新总时长
function updateTotalTime() {
  const duration = sound.duration();
  totalTimeEl.textContent = formatTime(duration);
}

// ============ 播放控制 ============
playBtn.addEventListener('click', function() {
  if (sound.playing()) {
    sound.pause();
    this.textContent = '播放';
  } else {
    sound.play();
    this.textContent = '暂停';
  }
});

// ============ 进度条拖动（核心） ============
function getPercentFromEvent(e) {
  const rect = progressContainer.getBoundingClientRect();
  const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
  const x = clientX - rect.left;
  return Math.min(Math.max(x / rect.width, 0), 1);
}

function seekFromEvent(e) {
  const percent = getPercentFromEvent(e);
  const duration = sound.duration();
  
  if (duration > 0) {
    const seekTime = percent * duration;
    sound.seek(seekTime);
    
    // 立即更新 UI
    updateProgressBar(percent);
    currentTimeEl.textContent = formatTime(seekTime);
  }
}

// ----- 鼠标事件 -----
progressContainer.addEventListener('mousedown', function(e) {
  isDragging = true;
  progressContainer.classList.add('dragging');
  
  // 暂停自动更新
  if (sound.playing()) {
    stopProgressUpdate();
  }
  
  // 跳转位置
  seekFromEvent(e);
  
  // 防止文本选中
  e.preventDefault();
});

document.addEventListener('mousemove', function(e) {
  if (isDragging) {
    seekFromEvent(e);
    e.preventDefault();
  }
});

document.addEventListener('mouseup', function() {
  if (isDragging) {
    isDragging = false;
    progressContainer.classList.remove('dragging');
    
    // 恢复自动更新
    if (sound.playing()) {
      startProgressUpdate();
    }
    
    // 更新一次确保准确
    if (!sound.playing()) {
      updateProgress();
    }
  }
});

// ----- 触摸事件（移动端） -----
progressContainer.addEventListener('touchstart', function(e) {
  sound.pause();
  e.preventDefault();
  isDragging = true;
  progressContainer.classList.add('dragging');
  
  //if (sound.playing()) {
  //  stopProgressUpdate();
  //}
  
  const touch = e.touches[0];
  seekFromEvent({ clientX: touch.clientX, touches: e.touches });
}, { passive: false });

progressContainer.addEventListener('touchmove', function(e) {
  if (isDragging) {
    e.preventDefault();
    const touch = e.touches[0];
    seekFromEvent({ clientX: touch.clientX, touches: e.touches });
  }
}, { passive: false });

progressContainer.addEventListener('touchend', function(e) {
  if (isDragging) {
    if(!sound.playing())sound.play();
    isDragging = false;
    progressContainer.classList.remove('dragging');
    updateProgress();
  }
});

// ============ 键盘快捷键 ============
document.addEventListener('keydown', function(e) {
  if (e.code === 'Space') {
    e.preventDefault();
    playBtn.click();
  }
  
  if (e.code === 'ArrowRight' || e.code === 'ArrowUp') {
    e.preventDefault();
    const current = sound.seek() || 0;
    const newTime = Math.min(current + 5, sound.duration());
    sound.seek(newTime);
    updateProgress();
    // 显示时间提示（可选）
    showTimeTooltip(newTime);
  }
  
  if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') {
    e.preventDefault();
    const current = sound.seek() || 0;
    const newTime = Math.max(current - 5, 0);
    sound.seek(newTime);
    updateProgress();
    showTimeTooltip(newTime);
  }
});

// ============ 时间提示工具（可选） ============
let tooltipTimeout = null;

function showTimeTooltip(time) {
  // 创建一个浮动的提示
  let tooltip = document.getElementById('timeTooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'timeTooltip';
    tooltip.style.cssText = `
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
    `;
    progressContainer.appendChild(tooltip);
  }
  
  tooltip.textContent = formatTime(time);
  tooltip.style.opacity = '1';
  
  clearTimeout(tooltipTimeout);
  tooltipTimeout = setTimeout(() => {
    tooltip.style.opacity = '0';
  }, 1500);
}

// ============ 清理资源 ============
window.addEventListener('beforeunload', function() {
  sound.unload();
  stopProgressUpdate();
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
  }
});

// ============ 窗口大小变化自适应 ============
window.addEventListener('resize', function() {
  // 如果正在播放，更新进度位置
  if (!isDragging && sound.playing()) {
    updateProgress();
  }
});

// 初始状态
resetProgress();