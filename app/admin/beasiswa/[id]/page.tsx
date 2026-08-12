"use client";
import { useParams } from 'next/navigation';
import ScholarshipForm from '@/components/admin/ScholarshipForm';

export default function AdminBeasiswaEditPage() {
  const params = useParams();
  const id = params?.id as string;
  return <ScholarshipForm scholarshipId={id} />;
}