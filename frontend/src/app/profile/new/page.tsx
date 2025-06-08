'use client';

import { useState, useEffect, useRef } from 'react';
import { authApi } from '@/api/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Container, 
  Paper, 
  Title, 
  TextInput, 
  Button, 
  Group, 
  Avatar, 
  Text, 
  Loader, 
  Center, 
  Box,
  Modal,
  ActionIcon,
  Switch,
  Alert,
  Textarea,
  LoadingOverlay,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ProfileData } from '@/types';
import { IconCamera, IconCrop, IconInfoCircle, IconAlertCircle } from '@tabler/icons-react';
import { useCloudinary } from '@/hooks/useCloudinary';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Cookies from 'js-cookie';
import { TokenService } from '@/api/apiService';
import Logger from '@/libs/logger';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phoneNumber: z.string().min(10, 'Phone number is required'),
  address: z.string().min(5, 'Address is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Helper function to center the crop
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90, // Default crop width percentage
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export default function NewProfilePage() {  
  const router = useRouter();  
  const params = useParams();
  const profileId = params.id as string;
  const { user, isLoading } = useAuth();  
  const { uploadMedia } = useCloudinary();
  const [profileData, setProfileData] = useState<ProfileData>({
    id: profileId,
    name: '',
    email: '',
    phone: '',
    address: '',
    image: null,
    role: 'USER' // Default role
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  
  // Image cropping states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get email from localStorage or cookies
        const emailFromStorage = localStorage.getItem('userEmail') || Cookies.get('userEmail');
        if (emailFromStorage) {
          setUserEmail(emailFromStorage);
        }

        // Check if user is authenticated
        const hasToken = TokenService.hasAnyToken();
        if (!hasToken) {
          router.push('/login');
          return;
        }

        // Check if user is new
        const isNewUserLocalStorage = localStorage.getItem('isNewUser');
        const isNewUserCookie = Cookies.get('isNewUser');

        const isNewUserStored = isNewUserLocalStorage === 'true' || isNewUserCookie === 'true';
        
        if (!isNewUserStored) {
          router.push('/dashboard');
          return;
        }

        setIsChecking(false);
      } catch (error) {
        setError('Error checking authentication status');
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setCropModalOpen(true);
      };
      
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset file input to allow same file selection again
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1 / 1)); // 1:1 aspect ratio
  }

  // Update preview when crop changes
  useEffect(() => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      drawCroppedImage(
        imgRef.current,
        previewCanvasRef.current,
        completedCrop
      );
    }
  }, [completedCrop]);

  function drawCroppedImage(
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    cropData: Crop
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.floor(cropData.width * scaleX * pixelRatio);
    canvas.height = Math.floor(cropData.height * scaleY * pixelRatio);

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = cropData.x * scaleX;
    const cropY = cropData.y * scaleY;

    const centerX = image.naturalWidth / 2;
    const centerY = image.naturalHeight / 2;

    ctx.save();
    ctx.translate(-cropX, -cropY);
    ctx.translate(centerX, centerY);
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight
    );

    ctx.restore();
  }

  const handleSaveCrop = async () => {
    if (!previewCanvasRef.current) {
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể tạo ảnh xem trước.',
        color: 'red',
      });
      return;
    }
     if (!completedCrop || !completedCrop.width || !completedCrop.height) {
      notifications.show({
        title: 'Lỗi',
        message: 'Vui lòng chọn vùng cắt hợp lệ.',
        color: 'red',
      });
      return;
    }

    setIsUploading(true);
    previewCanvasRef.current.toBlob(async (blob) => {
      if (!blob) {
        notifications.show({
          title: 'Lỗi',
          message: 'Không thể tạo ảnh từ vùng cắt.',
          color: 'red',
        });
        setIsUploading(false);
        return;
      }

      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      try {
        const result = await uploadMedia(file, 'image');
        
        setProfileData(prevProfileData => ({
          ...prevProfileData,
          image: result.secure_url
        }));
        setCropModalOpen(false);
        notifications.show({
          title: 'Thành công',
          message: 'Ảnh đại diện của bạn đã được tải lên.',
          color: 'green',
        });
      } catch (error: any) {
        Logger.error('Upload error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          stack: error.stack
        });
        
        notifications.show({
          title: 'Tải lên thất bại',
          message: `Đã có lỗi: ${error.message || 'Không xác định'}`,
          color: 'red',
        });
      } finally {
        setIsUploading(false);
        setSelectedImage(null);
        setCompletedCrop(null);
        setCrop(undefined);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleSubmitForm = async (data: ProfileFormData) => {
    try {
      setIsUpdating(true);
      setError(null);

      const accessToken = TokenService.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found');
      }

      if (!userEmail) {
        throw new Error('No user email found');
      }

      const requestBody = {
        name: data.fullName,
        phone: data.phoneNumber,
        address: data.address,
        email: userEmail,
        image: profileData.image,
        role: profileData.role
      };

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to create profile');
      }

      const responseData = await response.json();

      // Store new tokens
      TokenService.setAccessToken(responseData.access_token);
      TokenService.setRefreshToken(responseData.refresh_token);

      // Clear new user flags
      localStorage.removeItem('isNewUser');
      localStorage.removeItem('FORCE_PROFILE_REDIRECT');
      Cookies.remove('isNewUser');
      Cookies.remove('FORCE_PROFILE_REDIRECT');

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  // State for welcome info
  const [showWelcomeInfo, setShowWelcomeInfo] = useState(true);

  // Welcome component for Google OAuth users
  const WelcomeMessage = () => {
    // Only show if we have an email but incomplete profile
    const hasEmail = !!userEmail;
    const isIncompleteProfile = !profileData.name || !profileData.phone || !profileData.address;
    
    if (!hasEmail || !isIncompleteProfile || !showWelcomeInfo) return null;
    
    return (
      <Alert 
        icon={<IconInfoCircle size="1.2rem" />} 
        title="Chào mừng bạn đến với hệ thống!" 
        color="blue" 
        withCloseButton
        onClose={() => setShowWelcomeInfo(false)}
        mb="xl"
      >
        <Text size="sm">
          Bạn đã đăng nhập thành công với tài khoản Google. Vui lòng cung cấp thêm thông tin để hoàn tất hồ sơ của bạn.
        </Text>
      </Alert>
    );
  };

  if (isChecking) {
    return (
      <Container size="xs" my="xl">
        <Center mt="xl">
          <div style={{ textAlign: 'center' }}>
            <Loader size="lg" />
            <Text mt="md">Checking authentication status...</Text>
          </div>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xs" my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <LoadingOverlay visible={isUpdating} overlayProps={{ blur: 2 }} />
        <Title ta="center" order={2} mb="lg">
          Hoàn tất Hồ sơ của bạn
        </Title>
        <Text c="dimmed" size="sm" ta="center" mb="lg">
          Vui lòng cung cấp thêm thông tin để hoàn tất đăng ký.
        </Text>

        {error && (
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="Lỗi!"
            color="red"
            withCloseButton
            onClose={() => setError(null)}
            mb="md"
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
          <Box mb="xl" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Avatar 
                src={profileData.image || undefined} 
                alt={profileData.name || 'Ảnh đại diện'}
                size={120} 
                radius={100}
                mb="sm"
                style={{ cursor: 'pointer', border: '3px solid #e9ecef' }}
                onClick={handleAvatarClick}
              />
              <ActionIcon 
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
                radius="xl"
                size="lg"
                style={{ position: 'absolute', bottom: 8, right: 8 }}
                onClick={handleAvatarClick}
              >
                <IconCamera size={20} />
              </ActionIcon>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <Text size="sm" c="dimmed">Nhấn vào đây để thêm ảnh đại diện</Text>
          </Box>
          
          <TextInput
            label="Email"
            value={userEmail ?? ''}
            disabled
            mb="md"
          />
          
          <TextInput
            label="Tên"
            name="name"
            value={profileData.name}
            onChange={handleInputChange}
            mb="md"
            required
            placeholder="Nhập tên của bạn"
          />

          <TextInput
            label="Số điện thoại"
            name="phone"
            value={profileData.phone}
            onChange={handleInputChange}
            mb="md"
            required
            placeholder="Nhập số điện thoại của bạn"
          />

          <TextInput
            label="Địa chỉ"
            name="address"
            value={profileData.address}
            onChange={handleInputChange}
            mb="xl"
            required
            placeholder="Nhập địa chỉ của bạn"
          />

          <div>
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isUpdating ? 'Đang tạo hồ sơ...' : 'Tạo hồ sơ'}
            </button>
          </div>
        </form>
      </Paper>

      {/* Image Cropping Modal */}
      <Modal
        opened={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false);
          setSelectedImage(null);
          setCrop(undefined);
        }}
        title="Cắt ảnh đại diện"
        centered
        size="md"
      >
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {selectedImage && (
            <>
              <Text size="sm" c="dimmed" ta="center">
                Điều chỉnh vùng chọn để cắt ảnh. Ảnh sẽ hiển thị dạng tròn.
              </Text>
              
              <div style={{ maxWidth: '100%', maxHeight: '70vh' }}>
                <ReactCrop
                  crop={crop}
                  onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={selectedImage}
                    style={{ maxWidth: '100%', maxHeight: '60vh' }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    objectFit: 'contain',
                    border: '3px solid #e9ecef',
                    display: completedCrop ? 'block' : 'none',
                  }}
                />
              </div>

              <Group justify="center" mt="lg" style={{ width: '100%' }} gap="md">
                <Button
                  onClick={handleSaveCrop}
                  loading={isUploading}
                  leftSection={<IconCrop size={18} />}
                  size="sm"
                  radius="md"
                  variant="gradient"
                  gradient={{ from: 'teal', to: 'lime', deg: 105 }}
                  style={{ flexGrow: 1, maxWidth: '160px' }}
                >
                  Lưu Ảnh
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    setCropModalOpen(false);
                    setSelectedImage(null);
                    setCrop(undefined);
                  }}
                  size="sm"
                  radius="md"
                  style={{ flexGrow: 1, maxWidth: '160px' }}
                >
                  Hủy bỏ
                </Button>
              </Group>
            </>
          )}
        </Box>
      </Modal>

      <WelcomeMessage />
    </Container>
  );
} 