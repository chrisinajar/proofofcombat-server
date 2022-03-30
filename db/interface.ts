import Level from "level-ts";
import LRU from "lru-cache";

// import { uuid } from 'uuidv4';
import { BaseModel } from "types/graphql";

const rootDataPath = process.env.NODE_ENV === "test" ? "./test-data" : "./data";

export default class DatabaseInterface<Model extends BaseModel> {
  db: Level<Model>;
  cache = new LRU<string, Model>({ max: 1000 });

  constructor(database: string) {
    this.db = new Level<Model>(`${rootDataPath}/${database}`);
  }

  upgrade(data: Model): Model {
    return data;
  }

  async get(id: string): Promise<Model> {
    const possibleResult = this.cache.get(id);
    if (possibleResult) {
      return possibleResult;
    }
    const data = this.upgrade(await this.db.get(id));
    this.cache.set(id, data);
    return data;
  }

  async exists(id: string): Promise<boolean> {
    return this.db.exists(id);
  }

  async put(data: Model) {
    const initialId = data.id;
    data = this.upgrade(data);
    if (this.cache.has(initialId)) {
      this.cache.set(initialId, data);
    }
    return this.db.put(initialId, data);
  }

  async del(data: Model) {
    this.cache.delete(data.id);
    return this.db.del(data.id);
  }

  // async create(data: Omit<Model, "id">) {
  //   const id = uuid();
  // }
}
