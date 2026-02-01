const fs = require('fs');
const path = require('path');

class JsonStore {
    constructor(filename) {
        this.filePath = path.join(__dirname, '../data', filename);
        this.data = [];
        this.load();
    }

    load() {
        if (!fs.existsSync(this.filePath)) {
            this.data = [];
            this.save();
        } else {
            try {
                const fileData = fs.readFileSync(this.filePath, 'utf8');
                this.data = JSON.parse(fileData);
            } catch (error) {
                console.error(`Error reading ${this.filePath}:`, error);
                this.data = [];
            }
        }
    }

    save() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error(`Error writing ${this.filePath}:`, error);
        }
    }

    getAll() {
        this.load();
        return this.data;
    }

    getById(id) {
        this.load();
        return this.data.find(item => item._id === id);
    }

    getBy(predicate) {
        this.load();
        return this.data.find(predicate);
    }

    filter(predicate) {
        this.load();
        return this.data.filter(predicate);
    }

    add(item) {
        this.load();
        item._id = item._id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
        item.createdAt = new Date().toISOString();
        item.updatedAt = new Date().toISOString();
        this.data.push(item);
        this.save();
        return item;
    }

    update(id, updates) {
        this.load();
        const index = this.data.findIndex(item => item._id === id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updates, updatedAt: new Date().toISOString() };
            this.save();
            return this.data[index];
        }
        return null;
    }

    delete(id) {
        this.load();
        const index = this.data.findIndex(item => item._id === id);
        if (index !== -1) {
            const deleted = this.data.splice(index, 1);
            this.save();
            return deleted[0];
        }
        return null;
    }
}

module.exports = JsonStore;
