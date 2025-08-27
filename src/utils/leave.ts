// utils/leave.ts
import { ILeaveDocument } from '@/models/Leave';
import { ILeave, LeaveType, LeaveStatus } from '@/types/leave';

/**
 * Converts a Mongoose Leave document to ILeave interface
 * This is needed to bridge the gap between Mongoose types and our API types
 */
export function convertLeaveDocumentToILeave(doc: ILeaveDocument | any): ILeave {
  // Handle both regular documents and lean queries
  const id = doc._id?.toString() || doc.id;
  const employeeId = doc.employeeId?.toString() || doc.employeeId;
  const reviewedBy = doc.reviewedBy?.toString();
  
  return {
    id,
    employeeId,
    employeeName: doc.employeeName,
    employeeEmail: doc.employeeEmail,
    employeeMobile: doc.employeeMobile,
    leaveType: doc.leaveType as LeaveType,
    startDate: doc.startDate,
    endDate: doc.endDate,
    totalDays: doc.totalDays,
    reason: doc.reason,
    status: doc.status as LeaveStatus,
    reviewedBy,
    reviewedByName: doc.reviewedByName,
    reviewedAt: doc.reviewedAt,
    reviewComments: doc.reviewComments,
    emergencyContact: doc.emergencyContact,
    handoverNotes: doc.handoverNotes,
    attachments: doc.attachments || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

/**
 * Converts an array of Mongoose Leave documents to ILeave array
 */
export function convertLeaveDocumentsToILeaves(docs: (ILeaveDocument | any)[]): ILeave[] {
  return docs.map(convertLeaveDocumentToILeave);
}

/**
 * Type guard to check if object is a valid leave document
 */
export function isValidLeaveDocument(obj: any): obj is ILeaveDocument {
  return obj && 
         obj._id && 
         obj.employeeId && 
         obj.employeeName && 
         obj.leaveType && 
         obj.startDate && 
         obj.endDate;
}