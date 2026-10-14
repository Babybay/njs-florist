UPDATE "Store"
SET
  "name" = 'NJS Projects Denpasar',
  "address" = 'Denpasar, Bali',
  "mapsUrl" = 'https://maps.app.goo.gl/gMPNoNxhK1pBqSFd9'
WHERE "id" = 'store_seed_1';

UPDATE "Store"
SET
  "name" = 'NJS Projects Dalung',
  "address" = 'Dalung, Bali',
  "mapsUrl" = 'https://maps.app.goo.gl/cSi5RLGya56iUCzv7'
WHERE "id" = 'store_seed_2';

UPDATE "AppSetting"
SET "value" = 'NJS Projects'
WHERE "key" = 'business_name';

UPDATE "AppSetting"
SET "value" = 'Pilih studio Denpasar atau Dalung saat checkout'
WHERE "key" = 'pickup_address';

DELETE FROM "AppSetting"
WHERE "key" = 'business_email'
  AND "value" = 'halo@njsflorist.id';
