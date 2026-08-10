const drag = document.getElementById('playerContainer');


let playerIsDragging = false, progressDown = false,offsetX, offsetY,touchOffsetX = 0, touchOffsetY = 0;

document.getElementById("progressContainer").addEventListener('mousedown',()=> {progressDown = true});
document.getElementById("progressContainer").addEventListener('mouseup',()=> {progressDown = false});
document.getElementById("progressContainer").addEventListener('mouseleave',()=> {progressDown = false});

document.getElementById("progressContainer").addEventListener('touchstart',()=> {progressDown = true});
document.getElementById("progressContainer").addEventListener('touchend',()=> {progressDown = false});


drag.addEventListener('mousedown', (e) => {
    //console.log("down");
    if(!progressDown)playerIsDragging = true
    offsetX = e.clientX - drag.offsetLeft;
    offsetY = e.clientY - drag.offsetTop;
    drag.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    
  if (!playerIsDragging) return;

  // 计算新位置
  let newLeft = e.clientX - offsetX;
  let newTop = e.clientY - offsetY;
  
  // 边界限制
  const maxX = window.innerWidth - drag.offsetWidth;
  const maxY = window.innerHeight - drag.offsetHeight;
  
  newLeft = Math.max(0, Math.min(maxX, newLeft));
  newTop = Math.max(0, Math.min(maxY, newTop));
  
  drag.style.left = newLeft + 'px';
  drag.style.top = newTop + 'px';
});

document.addEventListener('mouseup', () => {
    playerIsDragging = false;
    drag.style.cursor = 'grab';
});

// 触摸开始
drag.addEventListener('touchstart', (e) => {
  
  //e.preventDefault(); // 防止页面滚动
  const touch = e.touches[0];
  const rect = drag.getBoundingClientRect();
  
  // 计算触摸点相对于元素左上角的偏移
  touchOffsetX = touch.clientX - rect.left;
  touchOffsetY = touch.clientY - rect.top;
  
  drag.style.cursor = 'grabbing';
 
}, { passive: false });

// 触摸移动
drag.addEventListener('touchmove', (e) => {
  if(progressDown == true){return}
  // 只处理触摸拖拽
  if (e.target.closest('#playerContainer')) {
    e.preventDefault(); // 防止页面滚动
  }
  
  const touch = e.touches[0];
  if (!touch) return;
  
  // 计算新位置（相对于视口）
  let newLeft = touch.clientX - touchOffsetX;
  let newTop = touch.clientY - touchOffsetY;
  
  // 边界限制（不能拖出屏幕）
  const maxX = window.innerWidth - drag.offsetWidth;
  const maxY = window.innerHeight - drag.offsetHeight;
  
  newLeft = Math.max(0, Math.min(maxX, newLeft));
  newTop = Math.max(0, Math.min(maxY, newTop));
  
  drag.style.left = newLeft + 'px';
  drag.style.top = newTop + 'px';
}, { passive: false });

// 触摸结束
drag.addEventListener('touchend', () => {
  drag.style.cursor = 'grab';
});


window.addEventListener('resize', () => {
  const maxX = window.innerWidth - drag.offsetWidth;
  const maxY = window.innerHeight - drag.offsetHeight;
  let left = parseInt(drag.style.left) || 100;
  let top = parseInt(drag.style.top) || 100;
  drag.style.left = Math.min(maxX, left) + 'px';
  drag.style.top = Math.min(maxY, top) + 'px';
});