import {sqliteTable,text,integer,primaryKey} from 'drizzle-orm/sqlite-core';
export const records=sqliteTable('records',{owner:text('owner').notNull(),id:text('id').notNull(),kind:text('kind').notNull(),payload:text('payload').notNull(),revision:integer('revision').notNull().default(0),updatedAt:text('updated_at').notNull()},t=>[primaryKey({columns:[t.owner,t.id]})]);
export const limits=sqliteTable('request_limits',{owner:text('owner').notNull(),bucket:text('bucket').notNull(),count:integer('count').notNull().default(0)},t=>[primaryKey({columns:[t.owner,t.bucket]})]);
