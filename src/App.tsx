  const addAppointment = async (apptData: Omit<Appointment, 'id' | 'status'> | Omit<Appointment, 'id' | 'status'>[]): Promise<boolean> => {
    try {
      const appts = Array.isArray(apptData) ? apptData : [apptData];
      
      // --- بداية منطق التحقق من التكرار ---
      for (const appt of appts) {
        const { data: existingAppt, error: checkError } = await supabase
          .from('appointments')
          .select('id')
          .eq('doctor_id', appt.doctorId)
          .eq('appointment_date', appt.date)
          .eq('appointment_time', appt.time)
          .maybeSingle();

        if (checkError) throw new Error("فشل التحقق من توفر الموعد");
        
        if (existingAppt) {
          alert(`عذراً، الموعد في تمام الساعة ${appt.time} محجوز بالفعل. يرجى اختيار وقت آخر.`);
          return false; // نوقف العملية إذا وجدنا موعداً محجوزاً
        }
      }
      // --- نهاية منطق التحقق ---

      const payload = appts.map(appt => ({ 
        patient_id: appt.patientId, 
        doctor_id: appt.doctorId, 
        appointment_date: appt.date, 
        appointment_time: appt.time, 
        status: 'PENDING', 
        notes: appt.notes || '' 
      }));

      const { error } = await supabase.from('appointments').insert(payload);
      if (error) throw new Error(error.message);
      
      await fetchAppointments(); 
      return true;
    } catch (err: any) { 
      alert(`عذراً، فشل حجز الموعد!\nالسبب: ${err.message}`); 
      return false; 
    }
  };
