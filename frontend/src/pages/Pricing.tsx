import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { upgrade } from '../api/endpoints';
import { Button, useToast, Modal } from '../components/shared';
import { CheckCircle2, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, fetchMe } = useAuthStore();
  const { show, ToastContainer } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'qrcode' | 'success'>('select');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat'>('alipay');

  // Reset state when modal closes
  useEffect(() => {
    if (!showPaymentModal) {
      setPaymentStep('select');
      setLoading(false);
    }
  }, [showPaymentModal]);

  const initiateUpgrade = (plan: 'monthly' | 'annual') => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setSelectedPlan(plan);
    setPaymentStep('select');
    setShowPaymentModal(true);
  };

  const handleShowQRCode = () => {
    setPaymentStep('qrcode');
    // Simulate user scanning and paying after 5 seconds
    setTimeout(() => {
      handlePaymentSuccess();
    }, 5000);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedPlan) return;
    
    setLoading(true);
    try {
      await upgrade(selectedPlan);
      await fetchMe();
      setPaymentStep('success');
      show({ message: '支付成功！升级完成', type: 'success' });
      setTimeout(() => {
        setShowPaymentModal(false);
        navigate('/history');
      }, 2000);
    } catch (error: any) {
      show({ message: error.message || '升级失败', type: 'error' });
      setPaymentStep('select'); // Go back to selection on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            简单透明的价格方案
          </h2>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">
            选择最适合您的方案
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-2">
          {/* Free Plan */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            <div className="p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">免费版</h2>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">适合初次体验 Banana Slides 的用户。</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">¥0</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">/月</span>
              </p>
              <Button
                variant="secondary"
                className="mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium"
                onClick={() => navigate('/')}
                disabled={!!currentUser?.is_pro}
              >
                {currentUser && !currentUser.is_pro ? '当前方案' : '开始使用'}
              </Button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-gray-900 dark:text-white tracking-wide uppercase">包含功能</h3>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3">
                  <CheckCircle2 className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-gray-500 dark:text-gray-400">最多创建 3 个项目</span>
                </li>
                <li className="flex space-x-3">
                  <CheckCircle2 className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-gray-500 dark:text-gray-400">PPT生成限 5 页（大纲页数不限）</span>
                </li>
                <li className="flex space-x-3">
                  <XCircle className="flex-shrink-0 h-5 w-5 text-red-500" />
                  <span className="text-gray-500 dark:text-gray-400">不支持导出 PPTX/PDF</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="border border-yellow-500 rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 relative">
             <div className="absolute top-0 right-0 -mt-3 -mr-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-600">
                  推荐
                </span>
             </div>
            <div className="p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">专业版</h2>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">为需要更多功能的专业用户打造。</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">¥19</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">/月</span>
              </p>
               <div className="mt-8 flex gap-4">
                  <Button
                    variant="primary"
                    className="flex-1 py-3 px-6 border border-transparent rounded-md text-center font-medium"
                    onClick={() => initiateUpgrade('monthly')}
                    disabled={loading || (!!currentUser?.is_pro && currentUser?.pro_type === 'monthly')}
                  >
                    {loading ? '处理中...' : (currentUser?.is_pro && currentUser?.pro_type === 'monthly' ? '当前方案' : '月付订阅')}
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 py-3 px-6 border border-transparent rounded-md text-center font-medium"
                    onClick={() => initiateUpgrade('annual')}
                    disabled={loading || (!!currentUser?.is_pro && currentUser?.pro_type === 'annual')}
                  >
                    {loading ? '处理中...' : (currentUser?.is_pro && currentUser?.pro_type === 'annual' ? '当前方案' : '年付 (¥190/年)')}
                  </Button>
               </div>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-gray-900 dark:text-white tracking-wide uppercase">包含功能</h3>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3">
                  <CheckCircle2 className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-gray-500 dark:text-gray-400">无限创建项目</span>
                </li>
                <li className="flex space-x-3">
                  <CheckCircle2 className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-gray-500 dark:text-gray-400">PPT生成页数无限制</span>
                </li>
                <li className="flex space-x-3">
                  <CheckCircle2 className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-gray-500 dark:text-gray-400">支持导出 PPTX/PDF</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
       <Modal
         isOpen={showPaymentModal}
         onClose={() => setShowPaymentModal(false)}
         title={paymentStep === 'qrcode' ? '扫码支付' : '选择支付方式'}
         size={paymentStep === 'qrcode' ? 'lg' : 'md'}
       >
         <div className="space-y-6">
           {paymentStep === 'select' && (
             <>
               <div className="grid grid-cols-2 gap-4">
                 <div 
                   className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'alipay' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                   onClick={() => setPaymentMethod('alipay')}
                 >
                   <div className="w-12 h-12 bg-[#1677FF] rounded-lg flex items-center justify-center text-white font-bold text-xl">支</div>
                   <span className="text-sm font-medium">支付宝</span>
                 </div>
                 <div 
                   className={`border rounded-lg p-4 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'wechat' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                   onClick={() => setPaymentMethod('wechat')}
                 >
                   <div className="w-12 h-12 bg-[#07C160] rounded-lg flex items-center justify-center text-white font-bold text-xl">微</div>
                   <span className="text-sm font-medium">微信支付</span>
                 </div>
               </div>
               
               <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-gray-500 dark:text-gray-400">商品名称</span>
                   <span className="font-medium">Banana Slides 专业版 - {selectedPlan === 'monthly' ? '月付' : '年付'}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-gray-500 dark:text-gray-400">应付金额</span>
                   <span className="text-xl font-bold text-gray-900 dark:text-white">
                     {selectedPlan === 'monthly' ? '¥19.00' : '¥190.00'}
                   </span>
                 </div>
               </div>

               <div className="flex justify-end gap-3">
                 <Button variant="ghost" onClick={() => setShowPaymentModal(false)}>取消</Button>
                 <Button variant="primary" onClick={handleShowQRCode} loading={loading}>
                   去支付
                 </Button>
               </div>
             </>
           )}

           {paymentStep === 'qrcode' && (
             <div className="flex flex-col items-center justify-center py-4">
               <div className="flex items-center gap-8 mb-6">
                 <div className="bg-white p-2 rounded-lg border shadow-sm">
                  <QRCodeSVG 
                    value={`https://banana-slides.com/pay/${selectedPlan}/${paymentMethod}`} 
                    size={160}
                    level={"H"}
                    includeMargin={true}
                  />
                 </div>
                 <div className="text-left space-y-3">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">实付：</span>
                      <span className="text-3xl font-bold text-red-500">
                        {selectedPlan === 'monthly' ? '19' : '190'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">元</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                       <span>使用</span>
                       {paymentMethod === 'wechat' ? (
                          <span className="flex items-center gap-1 text-[#07C160] font-medium"><div className="w-4 h-4 bg-[#07C160] rounded flex items-center justify-center text-white text-[10px]">微</div> 微信扫码支付</span>
                       ) : (
                          <span className="flex items-center gap-1 text-[#1677FF] font-medium"><div className="w-4 h-4 bg-[#1677FF] rounded flex items-center justify-center text-white text-[10px]">支</div> 支付宝扫码支付</span>
                       )}
                    </div>
                    <div className="text-xs text-gray-400">
                       支付即视为你同意 <span className="text-purple-600 cursor-pointer">《增值服务协议》</span>
                    </div>
                 </div>
               </div>
               <p className="text-sm text-gray-500 animate-pulse">正在等待手机扫码支付...</p>
             </div>
           )}

           {paymentStep === 'success' && (
             <div className="flex flex-col items-center justify-center py-8 space-y-4">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                 <CheckCircle2 className="w-8 h-8 text-green-600" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 dark:text-white">支付成功</h3>
               <p className="text-gray-500 dark:text-gray-400">您的账户已升级为专业版</p>
             </div>
           )}
         </div>
       </Modal>

      <ToastContainer />
    </div>
  );
};
