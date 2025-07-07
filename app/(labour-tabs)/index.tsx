import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../utils/api';
import { getCurrentLocation, requestLocationPermission, calculateDistance } from '../../utils/location';
import { Job } from '../../types/job';
import { User, Bell, Search, Clock, MapPin, MessageCircle, Users, DollarSign, Calendar, Star, Briefcase } from 'lucide-react-native';

export default function LabourHome() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [nearbyJobs, setNearbyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const stats = [
    { title: 'Jobs Applied', value: '8', color: '#8B4513' },
    { title: 'Jobs Completed', value: '25', color: '#22C55E' },
    { title: 'This Month', value: '₹15,000', color: '#F59E0B' },
  ];

  const loadNearbyJobs = useCallback(async () => {
    setLoading(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please allow location access to see nearby jobs.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: loadNearbyJobs },
          ]
        );
        return;
      }

      const currentLocation = await getCurrentLocation();
      if (!currentLocation) {
        Alert.alert('Error', 'Unable to get your location. Please try again.');
        return;
      }

      setLocation(currentLocation);

      const jobs = await apiClient.getNearbyJobs(
        currentLocation.latitude,
        currentLocation.longitude,
        2 // 2km radius
      );

      // Calculate distance for each job
      const jobsWithDistance = jobs.map(job => ({
        ...job,
        distance: calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          job.latitude,
          job.longitude
        ),
      }));

      // Sort by distance
      jobsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      setNearbyJobs(jobsWithDistance);
    } catch (error) {
      console.error('Load nearby jobs error:', error);
      Alert.alert('Error', 'Failed to load nearby jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNearbyJobs();
  }, [loadNearbyJobs]);
    

  const handleMessageFarmer = (job: Job) => {
    // Navigate to chat or show message interface
    Alert.alert(
      'Message Farmer',
      `Send a message to the farmer about "${job.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Message', onPress: () => {
          // TODO: Implement messaging functionality
          Alert.alert('Success', 'Message sent to farmer!');
        }},
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return '#22C55E'; // Active
      case 2: return '#F59E0B'; // In Progress
      case 3: return '#6B7280'; // Completed
      case 0: return '#EF4444'; // Cancelled
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return 'Open';
      case 2: return 'In Progress';
      case 3: return 'Completed';
      case 0: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t('dashboard.welcome')}</Text>
          <Text style={styles.username}>{user?.name || 'Labour'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <User size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        <View style={styles.searchSection}>
          <TouchableOpacity style={styles.searchButton} onPress={loadNearbyJobs}>
            <Search size={20} color="#6B7280" />
            <Text style={styles.searchText}>
              {loading ? 'Searching for jobs...' : 'Refresh nearby jobs'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.nearbyJobs}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Jobs</Text>
            {location && (
              <Text style={styles.locationText}>
                Within 2km of your location
              </Text>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading nearby jobs...</Text>
            </View>
          ) : nearbyJobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Briefcase size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No jobs found nearby</Text>
              <Text style={styles.emptySubtext}>Try refreshing or check back later</Text>
            </View>
          ) : (
            nearbyJobs.map((job) => (
              <View key={job.id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View style={styles.jobTitleSection}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(job.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.wageSection}>
                    <Text style={styles.jobPayment}>₹{job.daily_wage}</Text>
                    <Text style={styles.wageLabel}>per day</Text>
                  </View>
                </View>
                
                <Text style={styles.jobDescription} numberOfLines={2}>
                  {job.description}
                </Text>

                <View style={styles.jobMetrics}>
                  <View style={styles.metricItem}>
                    <Users size={16} color="#3B82F6" />
                    <Text style={styles.metricText}>{job.number_of_labourers} needed</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <MapPin size={16} color="#EF4444" />
                    <Text style={styles.metricText}>
                      {job.distance ? `${job.distance}km away` : 'Nearby'}
                    </Text>
                  </View>
                </View>

                <View style={styles.jobDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={14} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {formatDate(job.start_date)}
                      {job.end_date && ` - ${formatDate(job.end_date)}`}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Starts at {formatTime(job.start_date)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MapPin size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{job.location}</Text>
                  </View>
                </View>

                {job.required_skills && job.required_skills.length > 0 && (
                  <View style={styles.skillsSection}>
                    <Text style={styles.skillsLabel}>Required Skills:</Text>
                    <View style={styles.skillsContainer}>
                      {job.required_skills.slice(0, 3).map((skill, index) => (
                        <View key={index} style={styles.skillBadge}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                      {job.required_skills.length > 3 && (
                        <View style={styles.skillBadge}>
                          <Text style={styles.skillText}>+{job.required_skills.length - 3}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {job.perks && job.perks.length > 0 && (
                  <View style={styles.perksSection}>
                    <Star size={14} color="#F59E0B" />
                    <Text style={styles.perksText}>{job.perks.join(' • ')}</Text>
                  </View>
                )}
                
                <View style={styles.jobFooter}>
                  <View style={styles.farmerInfo}>
                    <Text style={styles.farmerText}>
                      {job.farmer_name ? `by ${job.farmer_name}` : 'Posted recently'}
                    </Text>
                    <Text style={styles.jobId}>Job #{job.id}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.messageButton}
                    onPress={() => handleMessageFarmer(job)}
                  >
                    <MessageCircle size={16} color="#FFFFFF" />
                    <Text style={styles.messageText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  username: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  profileButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  searchSection: {
    marginBottom: 24,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  nearbyJobs: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  locationText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitleSection: {
    flex: 1,
    marginRight: 16,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  wageSection: {
    alignItems: 'flex-end',
  },
  jobPayment: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B4513',
  },
  wageLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  jobDescription: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 16,
  },
  jobMetrics: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  jobDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
    fontWeight: '500',
  },
  skillsSection: {
    marginBottom: 16,
  },
  skillsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1D4ED8',
  },
  perksSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  perksText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  farmerInfo: {
    flex: 1,
  },
  farmerText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  jobId: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});