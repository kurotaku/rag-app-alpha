# 環境構築

## PostgreSQL

ローカルにPostgreSQLを入れて立ち上げる(14.9)

### brewでいれる場合
https://qiita.com/ysdyt/items/64ed98b420ea5c4e52ec

### asdf使う場合
https://github.com/smashedtoatoms/asdf-postgres

### PostgreSQL Start
pg_ctl start

### .env.localを編集

(DMでもらってください)

### パッケージインストール

```
yarn install
```

### DB migration

```
yarn migrate
```

## Run

```
yarn dev
```

--------------------------------

# お役立ちコマンド


## generete token
```
openssl rand -hex 64
```

--------------------------------

# デプロイ

アプリケーションを止める
```
pm2 delete app
```

(念の為)gitの変更破棄する
```
git checkout .
```

ソースコードPullする
```
git pull origin develop
```

(念のため)最新のリモートブランチの内容にする
```
git reset --hard origin/develop
```

(念のため)パッケージインストール
```
yarn install
```

(必要あれば)マイグレーション実行
```
yarn migrate
```

ビルドする
```
yarn build:eco
```

アプリ起動
```
pm2 start npm --name "app" -- start
```


