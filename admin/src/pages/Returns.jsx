import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Table, Tag, Button, Space, Modal, Input, Typography, Image } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { backendUrl } from '../config';

const { Text } = Typography;
const { TextArea } = Input;

const STATUS_COLORS = {
    Pending: 'warning',
    Approved: 'processing',
    Rejected: 'error',
    Completed: 'success'
};

const Returns = ({ token }) => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [currentReturn, setCurrentReturn] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchReturns = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const { data } = await axios.post(`${backendUrl}/api/return/list`, {}, { headers: { token } });
            if (data.success) {
                setReturns(data.returns);
            } else {
                toast.error(data.message || 'Lỗi tải danh sách trả hàng');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchReturns();
    }, [fetchReturns]);

    const handleUpdateStatus = async (status) => {
        if (!currentReturn || !token) return;
        try {
            setSubmitting(true);
            const { data } = await axios.post(
                `${backendUrl}/api/return/status`,
                {
                    returnId: currentReturn._id,
                    status,
                    adminNote
                },
                { headers: { token } }
            );

            if (data.success) {
                toast.success('Cập nhật trạng thái thành công');
                setActionModalVisible(false);
                fetchReturns();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const openActionModal = (ret) => {
        setCurrentReturn(ret);
        setAdminNote(ret.adminNote || '');
        setActionModalVisible(true);
    };

    const columns = [
        {
            title: 'Mã Đơn',
            key: 'orderId',
            render: (_, record) => (
                <Text strong>#{String(record.orderId).slice(-8).toUpperCase()}</Text>
            )
        },
        {
            title: 'Ngày Yêu cầu',
            key: 'date',
            render: (_, record) => new Date(record.date).toLocaleString('vi-VN')
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
            width: 300,
        },
        {
            title: 'Hình ảnh',
            key: 'images',
            render: (_, record) => (
                <Image.PreviewGroup>
                    <Space size={4}>
                        {(record.images || []).map((img, i) => (
                            <Image key={i} src={img} width={40} height={40} style={{ objectFit: 'cover' }} />
                        ))}
                    </Space>
                </Image.PreviewGroup>
            )
        },
        {
            title: 'Số tiền Hoàn (Dự kiến)',
            key: 'refundAmount',
            render: (_, record) => (
                <Text strong style={{ color: '#0f172a' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(record.refundAmount || 0)}
                </Text>
            )
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_, record) => (
                <Tag color={STATUS_COLORS[record.status] || 'default'} style={{ borderRadius: 999, fontWeight: 600 }}>
                    {record.status}
                </Tag>
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Button type="primary" onClick={() => openActionModal(record)}>
                    Xử lý
                </Button>
            )
        }
    ];

    return (
        <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
                <Text className="text-xl font-bold text-slate-800">Yêu cầu hoàn trả (RMA)</Text>
                <Button icon={<ReloadOutlined />} onClick={fetchReturns} loading={loading}>Làm mới</Button>
            </div>
            
            <Table
                dataSource={returns}
                columns={columns}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={`Xử lý Yêu cầu Hoàn Trả #${currentReturn ? String(currentReturn.orderId).slice(-8).toUpperCase() : ''}`}
                open={actionModalVisible}
                onCancel={() => setActionModalVisible(false)}
                footer={null}
                width={600}
            >
                {currentReturn && (
                    <div className="space-y-4 pt-4">
                        <div>
                            <Text className="block text-sm font-semibold text-slate-500 mb-1">Lý do của khách:</Text>
                            <div className="p-3 bg-slate-50 rounded-lg text-slate-700">
                                {currentReturn.reason}
                            </div>
                        </div>

                        <div>
                            <Text className="block text-sm font-semibold text-slate-500 mb-1">Trạng thái hiện tại:</Text>
                            <Tag color={STATUS_COLORS[currentReturn.status]}>{currentReturn.status}</Tag>
                        </div>

                        <div>
                            <Text className="block text-sm font-semibold text-slate-500 mb-1">Ghi chú Nội bộ (Admin):</Text>
                            <TextArea 
                                rows={3} 
                                value={adminNote} 
                                onChange={(e) => setAdminNote(e.target.value)} 
                                placeholder="Ghi chú về việc từ chối hoặc bồi thường..."
                            />
                        </div>

                        <div className="pt-4 flex flex-wrap gap-3 justify-end border-t border-slate-100">
                            {currentReturn.status === 'Pending' && (
                                <>
                                    <Button 
                                        danger 
                                        icon={<CloseCircleOutlined />} 
                                        loading={submitting} 
                                        onClick={() => handleUpdateStatus('Rejected')}
                                    >
                                        Từ chối (Từ chối hoàn trả)
                                    </Button>
                                    <Button 
                                        type="primary" 
                                        style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                                        loading={submitting} 
                                        onClick={() => handleUpdateStatus('Approved')}
                                    >
                                        Chấp nhận (Đợi trả hàng về)
                                    </Button>
                                </>
                            )}
                            
                            {currentReturn.status === 'Approved' && (
                                <Button 
                                    type="primary" 
                                    icon={<CheckCircleOutlined />} 
                                    loading={submitting} 
                                    onClick={() => handleUpdateStatus('Completed')}
                                >
                                    Đã Nhận Hàng & Hoàn Tiền (Khôi phục kho)
                                </Button>
                            )}

                            {(currentReturn.status === 'Completed' || currentReturn.status === 'Rejected') && (
                                <Text className="text-slate-500 text-sm italic">Yêu cầu này đã được đóng.</Text>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Returns;
