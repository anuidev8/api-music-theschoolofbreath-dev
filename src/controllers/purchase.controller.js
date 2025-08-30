const Blog = require("../models/blog.model");
const fs = require("fs");
const { buffer } = require('node:stream/consumers');
const stripePackage = require('stripe');
const { STRIPE: { secret, webhookSecret } } = require('../configs/vars')
const User = require('../models/user.model');
const stripe = stripePackage(secret);



exports.getOne = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const projects = await Blog.find();
    const data = await Blog.findOne({ slug: slug });
    if (!data || !data._id)
      return res
        .status(400)
        .json({ success: false, data: {}, info: "Blog not found" });
    data.views = data.views + 1;
    await data.save();
    for (const key in projects) {
      if (Object.hasOwnProperty.call(projects, key)) {
        if (projects[key]._id.toString() == data._id.toString()) {
          let index = key;
          let before =
            index > 0
              ? projects[index - 1].slug
              : projects[projects.length - 1].slug;
          index++;
          let after = projects[index] ? projects[index].slug : projects[0].slug;
          data.set("beforeAndAfter", {
            before: before,
            after: after,
          });
        }
      }
    }

    return res.status(200).json({ success: true, info: "OK", data: data });
  } catch (error) {
    next(error);
  }
};


exports.confirm = async (req, res, next) => {
  try {
    console.log(req)
    const sig = req.headers['stripe-signature'];
    let payload = JSON.stringify(req.body, null, 2);
    try {
      const payloadString = JSON.stringify(payload, null, 2);
      const secret = webhookSecret;

      const header = stripe.webhooks.generateTestHeaderString({
        payload: payloadString,
        secret
      });

      const event = stripe.webhooks.constructEvent(payloadString, header, secret);
      let data = JSON.parse(event)
      let customer = await stripe.customers.retrieve(data.data.object.customer)
      if (customer.email) {
        await User.findOneAndUpdate({ email: { $regex: customer.email, $options: "i" } }, { suscription: true })
      }

    } catch (err) {

      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

  } catch (error) {
    next(error);
  }
}
