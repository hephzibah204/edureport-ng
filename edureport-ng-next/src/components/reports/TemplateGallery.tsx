import React from 'react';
import { EliteModernTemplate } from './EliteModernTemplate';
import { ClassicProfessionalTemplate } from './ClassicProfessionalTemplate';
import { NurseryColorfulTemplate } from './NurseryColorfulTemplate';
import { PrimarySchoolTemplate } from './PrimarySchoolTemplate';

const dummyData = {
  school: {
    name: "Hephzibah Elite College",
    abbr: "HEC",
    motto: "Knowledge is Light",
    principal: "Dr. O. A. Adeyemi",
    address: "123 Academic Way, Education District, Lagos State",
    session: "2025/2026",
    term: "First Term"
  },
  student: {
    name: "Olawale Johnson",
    admissionNo: "HEC/2025/042",
    className: "SSS 2 Science",
    gender: "Male"
  },
  scores: {
    "Mathematics": { ca1: 15, ca2: 18, exam: 54, total: 87, grade: 'A', remark: 'Excellent' },
    "English Language": { ca1: 12, ca2: 15, exam: 48, total: 75, grade: 'A', remark: 'Very Good' },
    "Physics": { ca1: 18, ca2: 19, exam: 58, total: 95, grade: 'A+', remark: 'Outstanding' },
    "Chemistry": { ca1: 14, ca2: 12, exam: 45, total: 71, grade: 'B', remark: 'Good' },
    "Biology": { ca1: 10, ca2: 15, exam: 50, total: 75, grade: 'A', remark: 'Very Good' },
    "Further Mathematics": { ca1: 20, ca2: 20, exam: 60, total: 100, grade: 'A+', remark: 'Perfect' },
  },
  extras: {
    comments: {
      teacher: "An exceptionally bright and diligent student. His performance in Mathematics and Physics is particularly noteworthy.",
      principal: "Keep up the excellent work. You are a role model to your peers."
    }
  },
  grades: [
    { grade: 'A+', min: 90, max: 100, remark: 'Outstanding' },
    { grade: 'A', min: 75, max: 89, remark: 'Excellent' },
    { grade: 'B', min: 65, max: 74, remark: 'Good' },
    { grade: 'C', min: 50, max: 64, remark: 'Credit' },
    { grade: 'P', min: 40, max: 49, remark: 'Pass' },
    { grade: 'F', min: 0, max: 39, remark: 'Fail' },
  ]
};

export const TemplateGallery: React.FC = () => {
  return (
    <div className="space-y-20 p-10 bg-slate-900 min-h-screen">
      <div className="text-center text-white mb-20">
        <h1 className="text-5xl font-black mb-4">Report Card Template Gallery</h1>
        <p className="text-xl text-slate-400">Previewing designed templates with sample data.</p>
      </div>

      <section className="max-w-[21cm] mx-auto shadow-2xl">
        <div className="bg-indigo-600 text-white p-4 rounded-t-3xl font-bold uppercase tracking-widest text-center">
          1. Elite Modern Template (Glassmorphism)
        </div>
        <EliteModernTemplate data={dummyData as any} />
      </section>

      <section className="max-w-[21cm] mx-auto shadow-2xl">
        <div className="bg-slate-800 text-white p-4 rounded-t-3xl font-bold uppercase tracking-widest text-center">
          2. Classic Professional Template
        </div>
        <ClassicProfessionalTemplate data={dummyData as any} />
      </section>

      <section className="max-w-[21cm] mx-auto shadow-2xl">
        <div className="bg-amber-500 text-white p-4 rounded-t-3xl font-bold uppercase tracking-widest text-center">
          3. Nursery Colorful Template
        </div>
        <NurseryColorfulTemplate data={dummyData as any} />
      </section>
      <section className="max-w-[21cm] mx-auto shadow-2xl">
        <div className="bg-sky-500 text-white p-4 rounded-t-3xl font-bold uppercase tracking-widest text-center">
          4. Primary School Template
        </div>
        <PrimarySchoolTemplate data={dummyData as any} />
      </section>
    </div>
  );
};
