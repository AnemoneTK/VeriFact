import React from 'react';
import { Modal, Form, Input, Typography } from 'antd';

const { Text } = Typography;

export default function TransferProductModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  productId,
  productDetails 
}) {
  const [form] = Form.useForm();

  // ตรวจสอบความถูกต้องของที่อยู่ Ethereum
  const validateAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const { receiverAddress, price } = values;

      // ตรวจสอบที่อยู่ Ethereum
      if (!validateAddress(receiverAddress)) {
        form.setFields([{
          name: 'receiverAddress',
          errors: ['รูปแบบที่อยู่กระเป๋าเงินไม่ถูกต้อง']
        }]);
        return;
      }

      // ตรวจสอบราคา
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        form.setFields([{
          name: 'price',
          errors: ['กรุณากรอกราคาที่ถูกต้อง']
        }]);
        return;
      }

      // ส่งข้อมูลไปยังฟังก์ชันโอนสินค้า
      onConfirm(productId, receiverAddress, price);
      onClose();
    }).catch(errorInfo => {
      console.log('Validation Failed:', errorInfo);
    });
  };

  return (
    <Modal
      title="โอนสินค้า"
      open={isOpen}
      onOk={handleSubmit}
      onCancel={onClose}
      okText="ยืนยันการโอน"
      cancelText="ยกเลิก"
      width={450}
      okButtonProps={{
        style: { 
          backgroundColor: '#1890ff', 
          borderColor: '#1890ff' 
        }
      }}
    >
      {/* ข้อมูลสินค้า */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between mb-2">
          <Text type="secondary">รายละเอียด:</Text>
          <Text strong>
            {productDetails?.details?.split('|')[0] || 'ไม่ระบุ'}
          </Text>
        </div>
        <div className="flex justify-between">
          <Text type="secondary">ราคาเริ่มต้น:</Text>
          <Text strong>
            {productDetails?.initialPrice} บาท
          </Text>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          receiverAddress: '',
          price: ''
        }}
      >
        {/* ช่องกรอกที่อยู่ผู้รับ */}
        <Form.Item
          name="receiverAddress"
          label="ที่อยู่กระเป๋าเงินผู้รับ"
          rules={[
            { 
              required: true, 
              message: 'กรุณากรอกที่อยู่กระเป๋าเงินผู้รับ' 
            }
          ]}
        >
          <Input 
            placeholder="0x..." 
          />
        </Form.Item>

        {/* ช่องกรอกราคา */}
        <Form.Item
          name="price"
          label="ราคาโอน (บาท)"
          rules={[
            { 
              required: true, 
              message: 'กรุณากรอกราคา' 
            }
          ]}
        >
          <Input 
            type="number" 
            placeholder="0.00" 
            min={0}
            step={0.01}
          />
        </Form.Item>

        {/* คำเตือนการโอน */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
          <Text type="warning">
            คำเตือน: การโอนสินค้าเป็นการกระทำที่ไม่สามารถยกเลิกได้
            กรุณาตรวจสอบข้อมูลให้ถูกต้อง
          </Text>
        </div>
      </Form>
    </Modal>
  );
}