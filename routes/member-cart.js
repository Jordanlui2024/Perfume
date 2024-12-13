const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("./db");

// 顯示會員購物車頁面
router.get("/", async (req, res) => {
  try {
    const db = await getDB();
    const userId = new ObjectId(req.session.userId);

    let cartItems = [];
    let totalPrice = 0;
    let perfumes = [];

    const cart = await db.collection("shopping_carts").findOne({
      userId: userId,
      status: "active",
    });

    if (cart && cart.items && cart.items.length > 0) {
      const perfumeIds = cart.items.map((item) => new ObjectId(item.perfumeId));
      perfumes = await db
        .collection("perfumes")
        .find({ _id: { $in: perfumeIds } })
        .toArray();

      cartItems = cart.items.map((cartItem) => {
        const perfume = perfumes.find(
          (p) => p._id.toString() === cartItem.perfumeId.toString()
        );
        return {
          perfume,
          quantity: cartItem.quantity,
        };
      });

      totalPrice = cartItems.reduce(
        (sum, item) => sum + item.perfume.price * item.quantity,
        0
      );
    }

    res.render("member-cart", {
      cartItems,
      totalPrice,
      perfumes, // Add this line
      username: req.session.username,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).render("error", { message: "無法載入購物車" });
  }
});

router.get("/member/cart", async (req, res) => {
  const cart = req.session.cart || [];
  let perfumesInCart = [];

  if (cart.length > 0) {
    perfumesInCart = await getPerfumesById(cart);
  }

  res.render("member-cart", {
    perfumes: perfumesInCart,
    username: req.session.username,
  });
});

router.get("/perfumes", async (req, res) => {
  try {
    const db = await getDB();
    const perfumes = await db.collection("perfumes").find().toArray(); // 獲取所有香水的資料
    res.render("perfume-list", { perfumes }); // 傳遞到前端的模板
  } catch (error) {
    console.error("Error fetching perfumes:", error);
    res.status(500).send("伺服器錯誤");
  }
});

// 添加商品到會員購物車
router.post("/add", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "請先登入會員" });
    }

    const userId = req.session.userId;
    const { perfumeId } = req.body;

    if (!perfumeId || !ObjectId.isValid(perfumeId)) {
      return res.status(400).json({ success: false, message: "無效的商品 ID" });
    }

    const cart = await db.collection("shopping_carts").findOne({
      userId: new ObjectId(userId),
      status: "active",
    });

    if (!cart) {
      await db.collection("shopping_carts").insertOne({
        userId: new ObjectId(userId),
        items: [{ perfumeId: new ObjectId(perfumeId), quantity: 1 }],
        status: "active",
        createdAt: new Date(),
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.perfumeId.toString() === perfumeId
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.items.push({
          perfumeId: new ObjectId(perfumeId),
          quantity: 1,
          addedAt: new Date(),
        });
      }

      await db
        .collection("shopping_carts")
        .updateOne(
          { userId: new ObjectId(userId), status: "active" },
          { $set: { items: cart.items, lastModified: new Date() } }
        );
    }

    res.json({ success: true, message: "商品已加入會員購物車" });
  } catch (error) {
    console.error("會員購物車錯誤:", error);
    res.status(500).json({ success: false, message: "添加商品失敗" });
  }
});

// 移除商品
router.post("/remove", async (req, res) => {
  try {
    const db = await getDB();
    const userId = new ObjectId(req.session.userId);
    const { perfumeId } = req.body;

    const cart = await db.collection("shopping_carts").findOne({
      userId: userId,
      status: "active",
    });

    if (!cart) {
      return res.redirect("/member/cart");
    }

    cart.items = cart.items.filter(
      (item) => item.perfumeId.toString() !== perfumeId
    );

    await db
      .collection("shopping_carts")
      .updateOne(
        { userId: userId, status: "active" },
        { $set: { items: cart.items, lastModified: new Date() } }
      );

    res.redirect("/member/cart");
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({ success: false, message: "移除商品失敗" });
  }
});

// 計算購物車商品數量
router.get("/count", async (req, res) => {
  try {
    const db = await getDB();
    const userId = new ObjectId(req.session.userId);

    const cart = await db.collection("shopping_carts").findOne({
      userId: userId,
      status: "active",
    });

    const count = cart
      ? cart.items.reduce((total, item) => total + item.quantity, 0)
      : 0;

    res.json({ count });
  } catch (error) {
    console.error("Error getting cart count:", error);
    res.status(500).json({ error: "獲取購物車數量失敗" });
  }
});

module.exports = router;
