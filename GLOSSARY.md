# Krishi Bazar glossary

Language only. No implementation detail, specs or scratch notes. One word per concept; the "Avoid" list names the synonyms nobody uses.

## Terms
**Farmer (কৃষক)**: a producer who registers with a Bangladeshi mobile number and a password, and lists harvests for sale.
_Avoid_: user, vendor, seller, merchant

**Buyer (ক্রেতা)**: a guest who orders from a Listing; Buyers never hold accounts in this product.
_Avoid_: customer, client, user

**Listing (পণ্য)**: one Farmer's offer of one harvest: category, name, unit, price per unit, stock, grade, organic claim, harvest date, optional photo.
_Avoid_: item, product page, crop post

**Order (অর্ডার)**: a Buyer's request for a quantity of one Listing at a total price, moving through a fixed lifecycle from new to delivered or cancelled.
_Avoid_: booking, sale, transaction

**Stock (মজুত)**: the remaining quantity of a Listing; reserved the moment an Order is created and released if the Order ends cancelled.
_Avoid_: inventory, quantity (quantity is the amount inside one Order)

**Unit (একক)**: the measure a Listing is sold in — কেজি (kg), পিচ (piece), মণ (maund), হালি (4), ডজন (12), আঁটি (bundle), ঝুড়ি (basket), বস্তা (sack), লিটার (litre).
_Avoid_: scale, measure

**Paisa (পয়সা)**: the integer minor unit of Bangladeshi taka (১ টাকা = ১০০ পয়সা); every stored money amount is an integer number of Paisa.
_Avoid_: amount, float, decimal taka

**Fair price (ন্যায্য দাম)**: the advisory recommended price range for a Listing produced by the pricing module; the Farmer's manual price always wins.
_Avoid_: market price, suggested MRP

**Grade (গ্রেড)**: the codified quality class of a Listing — প্রিমিয়াম (Extra Class), গ্রেড-১ (Class I) or গ্রেড-২ (Class II).
_Avoid_: quality (quality is the everyday word; Grade is the field), tier, class

**Organic claim (জৈব ঘোষণা)**: the Farmer's self-declared, uncertified statement that a Listing was grown without chemicals.
_Avoid_: certified organic, bio

**Freshness (তাজাত্ব)**: the state derived from a Listing's harvest date and its category's real-world shelf-life window; shown as a badge and a best-before date.
_Avoid_: age, newness

**Delivery speed (ডেলিভারি গতি)**: express (১ দিন) or standard (৩ দিন), each adding a per-kilogram surcharge to an Order.
_Avoid_: shipping tier, courier option

**Comment (মন্তব্য)**: a guest remark on a Listing, rate-limited per IP; a Comment whose author phone matches a non-cancelled Order on that Listing carries the Verified buyer badge.
_Avoid_: review, feedback, rating

**Verified buyer (যাচাইকৃত ক্রেতা)**: the badge on a Comment whose author phone matches a non-cancelled Order for the same Listing.
_Avoid_: confirmed user

**Session (সেশন)**: one logged-in Farmer's server-side session, represented by an httpOnly cookie.
_Avoid_: login token, auth cookie

**Locale**: the UI language, Bangla (`bn`, default) or English (`en`), switchable at any time without reload.
_Avoid_: language setting, i18n mode

**Category (ধরন)**: the fixed Bangladesh-specific kind a Listing belongs to (e.g. ইলিশ, আম, পালং শাক); every Category belongs to exactly one Group (e.g. মাছ, ফল, শাক).
_Avoid_: type, group (a Group contains Categories), product kind

**Season (মৌসুম)**: the months of the year a Category is naturally harvested in Bangladesh; drives the Fair price multipliers and the seed data.
_Avoid_: weather, month

**District (জেলা)**: one of the 64 administrative districts of Bangladesh; a Farmer's location is District plus free-text village/upazila.
_Avoid_: region, location (location is district + village together), area

**Expired order (মেয়াদোত্তীর্ণ অর্ডার)**: an order still নতুন more than 24 hours after creation; it becomes বাতিল and its reserved Stock is released.
_Avoid_: timeout, stale order

## Relationships
- A Farmer has many Listings and many Orders (received).
- A Listing belongs to exactly one Farmer, one Category and one District, and has many Comments and many Orders.
- A Category belongs to exactly one Group; a Group is never chosen directly.
- An Order belongs to exactly one Listing and exactly one Buyer (guest details, no account).
- A Listing has exactly one Unit, one Grade and one category.
- Fair price advises a Listing's price from its Category, Grade, Organic claim, Season and platform history; Stock constrains an Order's quantity.

## Flagged ambiguities
- "user" meant both Farmer and Buyer; use those two words.
- "quality" meant both Grade and the Organic claim; those are two separate fields.
- "price" meant both the Farmer's price per unit and an Order's total; say "unit price" or "order total".
- "quantity" meant both a Listing's Stock and an Order's quantity; say "stock" or "order quantity".
