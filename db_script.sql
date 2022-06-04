CREATE TABLE "ERC20Token" (
	id SERIAL PRIMARY KEY,
	address varchar(50) UNIQUE,
	symbol varchar(50),
	image_url text DEFAULT 'https://assets-global.website-files.com/5f973c970bea5548ad4287ef/61e70d05f3c7146ab79e66bb_ethereum-eth.svg'
);


--drop table "ERC20Token"


select * from "ERC20Token"


CREATE TABLE wallet(
	id SERIAL PRIMARY KEY,
	address varchar(50) UNIQUE
);

INSERT INTO wallet (address) VALUES ('0x1161642e402d07D13B243d678d6d08f476c08c0e')

CREATE TABLE wallet_tokens_erc20_token(
	"walletId" int,
	"eRC20TokenId" int,
	CONSTRAINT PK_WALLET_IMPORT_TOKEN PRIMARY KEY("walletId","eRC20TokenId"),
	CONSTRAINT FK_WALLET_IMPORT_TOKEN_ERC20TOKEN FOREIGN KEY ("eRC20TokenId") REFERENCES "ERC20Token",
	CONSTRAINT FK_WALLET_IMPORT_TOKEN_Wallet FOREIGN KEY ("walletId") REFERENCES wallet
	
);


select * from wallet_tokens_erc20_token

--drop table wallet_tokens_erc20_token
-- SELECT "Wallet_tokens_rid"."walletId" AS "walletId", "Wallet_tokens_rid"."eRC20TokenId" AS "eRC20TokenId" FROM "ERC20Token" "ERC20Token" INNER JOIN "wallet_tokens_erc20_token" "Wallet_tokens_rid" ON ("Wallet_tokens_rid"."walletId" = $1 AND "Wallet_tokens_rid"."eRC20TokenId" = "ERC20Token"."id") ORDER BY "Wallet_tokens_rid"."eRC20TokenId" ASC, "Wallet_tokens_rid"."walletId" ASC


-- select "Wallet__Wallet_tokens".decimal from "ERC20Token" "Wallet__Wallet_tokens"
-- update  "ERC20Token" set "token_decimal" = 18
-- alter table "ERC20Token" rename column decimal to "decimal"
-- alter table "ERC20Token" add column "token_decimal" int

-- alter table "ERC20Token" drop column "decimal"
