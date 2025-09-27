document.addEventListener("DOMContentLoaded", function () {
    const faqItems = document.querySelectorAll('.faq-item');
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(function (question) {
        question.addEventListener('click', function () {
            const currentItem = question.parentElement;
            const isActive = currentItem.classList.contains('active');

            // Close all other items
            faqItems.forEach(function (item) {
                item.classList.remove('active');
            });

            // If the clicked item was not already active, open it
            if (!isActive) {
                currentItem.classList.add('active');
            }
        });
    });
});