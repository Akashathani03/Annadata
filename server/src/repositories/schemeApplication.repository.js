import { SchemeApplication } from '../models/SchemeApplication.js';

export async function findAllByUser(userId) {
  return SchemeApplication.find({ userId });
}

export async function findByUserAndScheme(userId, schemeId) {
  return SchemeApplication.findOne({ userId, schemeId });
}

export async function insert(applicationInput) {
  return SchemeApplication.create(applicationInput);
}
