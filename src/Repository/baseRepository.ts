import { Document, Model } from "mongoose";
import { IBaseRepository } from "../Interfaces/base.repository.interface";

export class BaseRepository<T extends Document> implements IBaseRepository<T> {
    protected model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async find(filter: Object): Promise<T | null> {
        return this.model.findOne(filter).exec();
    }

    async findOneAndPopulate(filter: object, populateFields?: string[]): Promise<T | null> {
        const query = this.model.findOne(filter);

        if (populateFields && populateFields.length > 0) {
            populateFields.forEach((field) => query.populate(field));
        }

        return query.exec();
    }

    async create(item: Partial<T>): Promise<T> {
        const newItem = new this.model(item)
        return newItem.save()
    }

    async findAll(
        filter: any = {},
        limit: number = 10,
        skip: number = 0,
        populateFields: string[] = []
    ): Promise<T[]> {

        const query = this.model.find(filter).skip(skip).limit(limit);
        populateFields.forEach((field) => query.populate(field));
        return query;
    }

    async updateAndReturn(filter: object, updateData: any, options: object = { new: true }): Promise<T | null> {
        try {
            return await this.model.findOneAndUpdate(filter, updateData, options).exec();
        } catch (error: any) {
            console.error('Error updating and returning document:', error.message);
            throw new Error('Error updating and returning document. Please try again later.');
        }
    }

    async updateManyReturn(
        filter: object,
        updateData: any,
        options: object = {}
    ): Promise<T[]> {
        try {
            await this.model.updateMany(filter, updateData, options);
            return await this.model.find(filter);
        } catch (error: any) {
            console.error('Error updating and returning document:', error.message);
            throw new Error('Error updating and returning document. Please try again later.');
        }
    }


    async countDoc(filter: Object = {}): Promise<number> {
        const count = await this.model.countDocuments(filter);
        return count;
    }

    async findOneAndDeleteAlternative(filter: object): Promise<T | null> {
        try {
            const document = await this.model.findOne(filter).exec();

            if (!document) {
                return null;
            }

            await this.model.deleteOne({ _id: document._id });
            return document;
        } catch (error: any) {
            console.error('Error finding and deleting document:', error.message);
            throw new Error('Error finding and deleting document. Please try again later.');
        }
    }   

}