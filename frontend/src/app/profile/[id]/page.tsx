'use client';

import { useState, useEffect, useRef } from 'react';
import { authApi, profileApi } from '@/api/apiService';
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
  Slider
} from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { ProfileData } from '@/types';
import { IconCamera, IconCrop } from '@tabler/icons-react';
import { useCloudinary } from '@/hooks/useCloudinary';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useParams, useRouter } from 'next/navigation';
import Logger from '@/libs/logger';

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

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;
  const { user, isLoading, updateUserInfo } = useAuth();
  const { uploadMedia } = useCloudinary();
  const [profileData, setProfileData] = useState<ProfileData>({
    id: profileId,
    name: '',
    email: '',
    phone: '',
    address: '',
    image: null,
    role: 'USER'
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

  useEffect(() => {
    if (user) {
      setProfileData({
        id: profileId,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        image: user.image || null,
        role: user.role || 'USER'
      });
    }
  }, [user]);

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
      // Don't reset crop yet
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

  // Debounce for preview update (optional but good for performance)
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

    // 5) Move the crop origin to the canvas origin (0,0)
    ctx.translate(-cropX, -cropY);
    // 4) Move the origin to the center of the original position
    ctx.translate(centerX, centerY);
    // 3) Rotate around the origin
    // ctx.rotate(0); // No rotation for this example
    // 2) Scale the image
    // ctx.scale(1, 1); // No scaling for this example
    // 1) Move the center of the image to the origin (0,0)
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

        // Save profile after image upload
        try {
          const currentUser = await authApi.getCurrentUser();
          const userId = currentUser?.id;
          
          if (!userId) {
            throw new Error('Failed to get user ID for profile update');
          }

          await profileApi.updateUser(userId, {
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            phone: profileData.phone,
            address: profileData.address,
            image: result.secure_url,
            role: profileData.role
          });

          notifications.show({
            title: 'Thành công',
            message: 'Ảnh đại diện đã được cập nhật thành công',
            color: 'green'
          });
        } catch (error) {
          Logger.error('Lỗi cập nhật ảnh đại diện:', error);
          notifications.show({
            title: 'Lỗi',
            message: (error as Error).message || 'Không thể cập nhật ảnh đại diện',
            color: 'red'
          });
        }

        setCropModalOpen(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const currentUser = await authApi.getCurrentUser();
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('Failed to get user ID for profile update');
      }

      const response = await profileApi.updateUser(userId, {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        image: profileData.image || '',
        role: profileData.role
      });

      notifications.show({
        title: 'Thành công',
        message: 'Hồ sơ đã được cập nhật thành công',
        color: 'green'
      });

      // Update user info in context before redirecting
      await updateUserInfo();

      // navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      Logger.error('Lỗi cập nhật hồ sơ:', error);
      notifications.show({
        title: 'Lỗi',
        message: (error as Error).message || 'Không thể cập nhật hồ sơ',
        color: 'red'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Center style={{ height: '70vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Paper shadow="md" p="xl" radius="md" withBorder>
        <Title order={2} ta="center" mb="xl">Cài đặt Hồ sơ</Title>
        
        <form onSubmit={handleSubmit}>
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
            <Text size="sm" c="dimmed">Nhấn vào ảnh đại diện để thay đổi</Text>
          </Box>
          
          <TextInput
            label="Email"
            value={profileData.email}
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
          
          <Group justify="flex-end">
            <Button type="submit" loading={isUpdating} size="md" radius="md" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
              Cập nhật Hồ sơ
            </Button>
          </Group>
        </form>
      </Paper>

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
        overlayProps={{ backgroundOpacity: 0.6, blur: 3 }}
        styles={{
          header: { backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6', padding: '1rem 1.5rem' },
          title: { fontSize: '1.2rem', fontWeight: '600', color: '#212529' },
          body: { padding: '1.5rem', backgroundColor: '#ffffff' },
        }}
      >
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {selectedImage && (
            <>
              <Text size="sm" c="dimmed" ta="center">
                Điều chỉnh vùng chọn để cắt ảnh. Ảnh sẽ hiển thị dạng tròn.
              </Text>
              <Box
                style={{
                  width: '100%',
                  maxWidth: '350px',
                  maxHeight: '350px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: '#f1f3f5',
                  padding: '0.5rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {selectedImage && (
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop
                    minWidth={50}
                    minHeight={50}
                  >
                    <img
                      ref={imgRef}
                      src={selectedImage}
                      alt="Để cắt"
                      style={{ maxHeight: '330px', display: 'block', margin: 'auto' }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                )}
              </Box>

              {completedCrop && (completedCrop.width ?? 0) > 0 && (
                <Box mt="md" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderTop: '1px solid #e9ecef', paddingTop: '1rem', width: '100%' }}>
                  <Text fw={500} mb="xs" size="sm">Xem trước</Text>
                  <canvas
                    ref={previewCanvasRef}
                    style={{
                      border: '1px solid #ced4da',
                      borderRadius: '50%',
                      objectFit: 'contain',
                      width: 100,
                      height: 100,
                    }}
                  />
                </Box>
              )}

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
    </Container>
  );
} 