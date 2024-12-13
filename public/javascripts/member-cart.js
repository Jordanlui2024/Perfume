document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".perfume-grid");
  if (!grid) return;

  grid.addEventListener("click", async (event) => {
    const button = event.target.closest(".add-to-member-cart");
    if (!button) return;

    const perfumeId = button.dataset.id;

    try {
      const response = await fetch("/member/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfumeId }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      alert(result.message);
    } catch (error) {
      console.error("會員購物車錯誤:", error);
      alert("加入會員購物車失敗，請稍後再試");
    }
  });
});
