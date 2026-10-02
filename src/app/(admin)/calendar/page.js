'use client';

import React, { useState, useEffect } from 'react';
import styles from './calendar.module.css';
import TopBar from '@/components/TopBar/TopBar';
import BottomNav from '@/components/BottomNav/BottomNav';
import { getAppointmentsByDate } from '@/app/actions/data';

export default function AdminCalendarPage() {
  const [activeDate, setActiveDate] = useState(new Date().getDate());
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    async function fetchAppts() {
      const today = new Date();
      const monthStr = String(today.getMonth() + 1).padStart(2, '0');
      const dateStr = `${today.getFullYear()}-${monthStr}-${String(activeDate).padStart(2, '0')}`;
      
      const appts = await getAppointmentsByDate(dateStr);
      
      const formatted = appts.map(a => {
        let [hours, minutes] = a.time.split(':');
        hours = parseInt(hours, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hourLabel = `${hours}:${minutes} ${ampm}`;
        
        return {
          id: a.id,
          hour: hourLabel, // We might need to match this with the timeline rows
          client: 'Client', // Or a.user_id if we fetched user name
          service: a.service?.name || 'Service',
          stylistClass: styles.stylistA
        };
      });
      setAppointments(formatted);
    }
    fetchAppts();
  }, [activeDate]);

  // Generate dates for the week
  const dates = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return { day: days[d.getDay()], date: d.getDate() };
  });

  const hours = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM'
  ];

  // Dynamic appointments now in state

  return (
    <div className={styles.container}>
      <TopBar title="Booking Calendar" showBack={false} />
      
      <div className={styles.content}>
        <div className={styles.dateScroller}>
          {dates.map((d, index) => (
            <div 
              key={index} 
              className={`${styles.dateItem} ${activeDate === d.date ? styles.active : ''}`}
              onClick={() => setActiveDate(d.date)}
            >
              <span className={styles.dayName}>{d.day}</span>
              <span className={styles.dayNumber}>{d.date}</span>
            </div>
          ))}
        </div>

        <div className={styles.timelineContainer}>
          {hours.map((hour, index) => {
            // Find appointments that match the hour block.
            // A simple match by starting time.
            const hourAppointments = appointments.filter(a => {
              // Convert both to hour parts for a rough match, e.g. "9:00 AM" matches "9:00 AM"
              const aHourPart = a.hour.split(':')[0];
              const aAmPm = a.hour.split(' ')[1];
              const hHourPart = hour.split(':')[0];
              const hAmPm = hour.split(' ')[1];
              return aHourPart === hHourPart && aAmPm === hAmPm;
            });
            
            return (
              <div key={index} className={styles.timeRow}>
                <div className={styles.timeLabel}>{hour}</div>
                <div className={styles.timeSlot}>
                  {hourAppointments.length > 0 ? (
                    hourAppointments.map(app => (
                      <div key={app.id} className={`${styles.appointment} ${app.stylistClass}`}>
                        <div className={styles.clientName}>{app.client}</div>
                        <div className={styles.serviceInfo}>{app.service}</div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptySlot}>
                      <span className={styles.emptyIcon}>+</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className={styles.fab}>
        <span className={styles.fabIcon}>+</span> Walk-in
      </button>

      <BottomNav activeTab="calendar" variant="admin" />
    </div>
  );
}
