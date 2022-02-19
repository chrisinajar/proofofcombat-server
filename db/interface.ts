import Level from "level-ts";
// import { uuid } from 'uuidv4';
import { BaseModel } from "types";

export default class DatabaseInterface<Model extends BaseModel> {
  db: Level<Model>;

  constructor(database: string) {
    this.db = new Level<Model>(`./data/${database}`);
  }

  upgrade(data: Model): Model {
    return data;
  }

  async get(id: string): Promise<Model> {
    return this.upgrade(await this.db.get(id));
  }

  async exists(id: string): Promise<boolean> {
    return this.db.exists(id);
  }

  async put(data: Model) {
    return this.db.put(data.id, this.upgrade(data));
  }
  async del(data: Model) {
    return this.db.del(data.id);
  }

  // async create(data: Omit<Model, "id">) {
  //   const id = uuid();
  // }
}
