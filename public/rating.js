const starContainer = document.getElementById('starContainer');
const stars = document.querySelectorAll('.star');
let rating = 0;

stars.forEach(star => {
  // Highlight on hover
  star.addEventListener('mouseover', () => {
    clearHover();
    const value = parseInt(star.getAttribute('data-value'));
    for (let i = 0; i < value; i++) {
      stars[i].classList.add('hover');
    }
  });

  // Remove highlight when not hovering
  star.addEventListener('mouseout', clearHover);

  // Select rating on click
  star.addEventListener('click', () => {
    rating = parseInt(star.getAttribute('data-value'));
    clearSelected();
    for (let i = 0; i < rating; i++) {
      stars[i].classList.add('selected');
    }
  });
});

function clearHover() {
  stars.forEach(s => s.classList.remove('hover'));
}

function clearSelected() {
  stars.forEach(s => s.classList.remove('selected'));
}

// On "Submit Rating" click
document.getElementById('submitRatingBtn').addEventListener('click', () => {
  if (rating === 0) {
    alert("Please select a rating first!");
    return;
  }
  // Redirect based on rating
  if (rating >= 4) {
    window.location.href = "success.html";
  } else {
    window.location.href = "feedback.html";
  }
});
