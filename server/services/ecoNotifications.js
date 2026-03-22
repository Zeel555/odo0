const User = require('../models/User');
const Company = require('../models/Company');
const { sendPlainEmail } = require('./mail');

const clientBase = () => process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * When ECO enters an approval-required stage — notify approvers.
 */
async function notifyApproversStage(eco, companyId) {
  try {
    const approvers = await User.find({
      companyId,
      role: 'approver',
      isActive: { $ne: false },
    }).select('email name');
    const company = await Company.findById(companyId).select('name').lean();
    const companyName = company?.name || 'Your workspace';
    const link = `${clientBase()}/eco/${eco._id}`;
    const subject = `[RevoraX] ECO awaiting approval: ${eco.title}`;
    const text = `Hello,\n\nAn Engineering Change Order needs your review.\n\nTitle: ${eco.title}\nCompany: ${companyName}\n\nOpen: ${link}\n\n— RevoraX`;
    const html = `<p>An <strong>ECO</strong> needs your approval.</p><p><strong>${eco.title}</strong><br/>${companyName}</p><p><a href="${link}">Open in RevoraX</a></p>`;
    for (const u of approvers) {
      if (u.email) await sendPlainEmail({ to: u.email, subject, text, html });
    }
  } catch (e) {
    console.error('[ecoNotifications] notifyApproversStage:', e.message);
  }
}

/**
 * ECO rejected — notify creator.
 */
async function notifyCreatorRejected(eco) {
  try {
    const creator = eco.user?.email ? eco.user : await User.findById(eco.user).select('email name');
    if (!creator?.email) return;
    const subject = `[RevoraX] ECO rejected: ${eco.title}`;
    const text = `Hi ${creator.name || ''},\n\nYour ECO "${eco.title}" was rejected.\n\nReason: ${eco.rejectReason || '(none)'}\n\n— RevoraX`;
    const html = `<p>Your ECO <strong>${eco.title}</strong> was <strong>rejected</strong>.</p><p>Reason: ${eco.rejectReason || '—'}</p>`;
    await sendPlainEmail({ to: creator.email, subject, text, html });
  } catch (e) {
    console.error('[ecoNotifications] notifyCreatorRejected:', e.message);
  }
}

/**
 * ECO reached final stage — notify creator they can ask admin to apply (or self-serve messaging).
 */
async function notifyCreatorReadyToApply(eco) {
  try {
    const uid = eco.user?._id || eco.user;
    const creator = await User.findById(uid).select('email name');
    if (!creator?.email) return;
    const link = `${clientBase()}/eco/${eco._id}`;
    const subject = `[RevoraX] ECO approved — ready to apply: ${eco.title}`;
    const text = `Hi ${creator.name || ''},\n\nYour ECO "${eco.title}" reached the final stage. An administrator can now apply it to master data.\n\nOpen: ${link}\n\n— RevoraX`;
    const html = `<p>Your ECO <strong>${eco.title}</strong> is in the <strong>final stage</strong>. An admin can <strong>Apply</strong> it to update master data.</p><p><a href="${link}">View ECO</a></p>`;
    await sendPlainEmail({ to: creator.email, subject, text, html });
  } catch (e) {
    console.error('[ecoNotifications] notifyCreatorReadyToApply:', e.message);
  }
}

module.exports = {
  notifyApproversStage,
  notifyCreatorRejected,
  notifyCreatorReadyToApply,
};
