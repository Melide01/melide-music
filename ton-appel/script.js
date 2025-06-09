

function sendChange(element, text) {

}


document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector(".slider");
  const ball = document.querySelector(".ball");

  let isDragging = false;

  const startDrag = (e) => {
    isDragging = true;
    moveBall(e);
  };

  const stopDrag = () => {
    isDragging = false;
    ball.style.left = '.25em'
  };

  const moveBall = (e) => {
    if (!isDragging) return;

    const sliderRect = slider.getBoundingClientRect();
    const ballRect = ball.getBoundingClientRect();

    let clientX = e.clientX;
    if (e.touches) clientX = e.touches[0].clientX;

    // Calculate the new left position of the ball
    let x = clientX - sliderRect.left - ballRect.width / 2;

    // Constrain the ball within the slider
    x = Math.max(0, Math.min(x, sliderRect.width - ballRect.width));

    ball.style.left = `${x}px`;
  };

  // Mouse events
  ball.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", moveBall);
  document.addEventListener("mouseup", stopDrag);

  // Touch events
  ball.addEventListener("touchstart", startDrag, { passive: true });
  document.addEventListener("touchmove", moveBall, { passive: true });
  document.addEventListener("touchend", stopDrag);
});
