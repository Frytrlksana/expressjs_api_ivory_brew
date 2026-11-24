/**
 * Controller Data Member & Customer Loyalty
 */
const memberService = require('../services/member.service');

const getAllMembers = async (req, res, next) => {
  try {
    const result = await memberService.getAllMembers(req.query);
    res.status(200).json({
      success: true,
      message: 'Data member berhasil diambil',
      data: result.members,
      pagination: {
        total_items: result.total_items,
        total_pages: result.total_pages,
        current_page: result.current_page,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMemberByPhone = async (req, res, next) => {
  try {
    const member = await memberService.getMemberByPhone(req.params.phone);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member tidak ditemukan',
        data: null,
      });
    }
    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

const getMemberById = async (req, res, next) => {
  try {
    const member = await memberService.getMemberById(req.params.id);
    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

const createMember = async (req, res, next) => {
  try {
    const member = await memberService.createMember(req.body);
    res.status(201).json({
      success: true,
      message: 'Member berhasil didaftarkan',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

const updateMember = async (req, res, next) => {
  try {
    const member = await memberService.updateMember(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Data member berhasil diperbarui',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMember = async (req, res, next) => {
  try {
    const result = await memberService.deleteMember(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const claimReward = async (req, res, next) => {
  try {
    const member = await memberService.claimReward(req.body.phone);
    res.status(200).json({
      success: true,
      message: 'Reward kopi gratis berhasil diklaim (9 stamps digunakan)',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMembers,
  getMemberByPhone,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  claimReward,
};
