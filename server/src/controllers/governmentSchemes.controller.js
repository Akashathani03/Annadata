import { sendSuccess } from '../utils/apiResponse.js';
import * as governmentSchemesService from '../services/domain/schemes/governmentSchemes.service.js';
import * as schemeApplicationsService from '../services/domain/schemes/schemeApplications.service.js';

export async function getSchemes(req, res, next) {
  try {
    const schemes = await governmentSchemesService.getSchemes({
      type: req.query.type,
      stateFilter: req.query.stateFilter,
      query: req.query.q,
    });
    sendSuccess(res, { schemes });
  } catch (err) {
    next(err);
  }
}

export async function getSchemeById(req, res, next) {
  try {
    const scheme = await governmentSchemesService.getSchemeById(req.params.id);
    sendSuccess(res, { scheme });
  } catch (err) {
    next(err);
  }
}

export async function getMyApplications(req, res, next) {
  try {
    const applications = await schemeApplicationsService.getMyApplications(req.user.id);
    sendSuccess(res, { applications });
  } catch (err) {
    next(err);
  }
}

export async function applyToScheme(req, res, next) {
  try {
    const application = await schemeApplicationsService.applyToScheme(req.user.id, req.params.id);
    sendSuccess(res, { application }, 201);
  } catch (err) {
    next(err);
  }
}
