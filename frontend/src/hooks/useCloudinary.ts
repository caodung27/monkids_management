import axios from 'axios';

export const useCloudinary = () => {
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  // Debug logging to identify environment variable issues
  console.log('Cloudinary config:', {
    cloudName: cloudName ? 'defined' : 'missing',
    uploadPreset: uploadPreset ? 'defined' : 'missing',
    apiKey: apiKey ? 'defined' : 'missing',
  });

  const uploadMedia = async (file: File, type: string = 'image') => {
    if (!cloudName) {
      throw new Error('Cloudinary cloud name is missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env.local');
    }

    if (!uploadPreset) {
      throw new Error('Cloudinary upload preset is missing. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local');
    }

    console.log('Starting upload to Cloudinary:', { fileSize: file.size, fileType: file.type });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    if (apiKey) formData.append('api_key', apiKey);

    try {
      const response = await axios({
        url: `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`,
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Cloudinary upload error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(`Lỗi tải lên Cloudinary: ${error.message}`);
    }
  };

  return { uploadMedia };
};
