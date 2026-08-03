import { GovernmentScheme } from '../models/GovernmentScheme.js';

export async function findAll() {
  return GovernmentScheme.find();
}

export async function findById(id) {
  return GovernmentScheme.findById(id);
}
