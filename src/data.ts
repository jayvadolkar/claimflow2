import { Survey } from './types';

export const stages = [
  'Survey Create/Intake',
  'Evidence Collection',
  'Inspection, AI Assessment & repair',
  'Settlement Stage',
  'Closing stage'
];
export const insurers = ['ICICI Lombard', 'HDFC Ergo', 'United India', 'Bajaj Allianz', 'SBI General', 'AIG', 'Allianz', 'AXA'];
export const handlers = ['Sahil Dash', 'Rohan Mehta', 'Anita Rao', 'Vikram Singh', 'Priya Sharma', 'Alex Johnson', 'Sarah Williams', 'Michael Chen', 'Emma Davis'];
export const surveyors = ['Rajesh Kumar', 'Desktop Assessment', 'Suresh Menon', 'Amit Patel', 'Neha Gupta', 'Karan Desai', 'Pooja Iyer'];

export const makesAndModels = [
  { make: 'Hyundai', models: ['Creta', 'i20', 'Venue', 'Verna'] },
  { make: 'Maruti Suzuki', models: ['Swift', 'Baleno', 'Brezza', 'Dzire'] },
  { make: 'Honda', models: ['City', 'Amaze', 'Elevate'] },
  { make: 'Tata', models: ['Nexon', 'Harrier', 'Punch', 'Safari'] },
  { make: 'Mahindra', models: ['XUV700', 'Thar', 'Scorpio', 'XUV300'] },
  { make: 'Toyota', models: ['Innova', 'Fortuner', 'Glanza'] }
];

export const stateData = [
  { state: 'Maharashtra', code: 'MH', cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik'], zone: 'West' },
  { state: 'Delhi', code: 'DL', cities: ['New Delhi', 'Dwarka', 'Rohini'], zone: 'North' },
  { state: 'Karnataka', code: 'KA', cities: ['Bangalore', 'Mysore', 'Hubli'], zone: 'South' },
  { state: 'Tamil Nadu', code: 'TN', cities: ['Chennai', 'Coimbatore', 'Madurai'], zone: 'South' },
  { state: 'Gujarat', code: 'GJ', cities: ['Ahmedabad', 'Surat', 'Vadodara'], zone: 'West' },
  { state: 'Uttar Pradesh', code: 'UP', cities: ['Lucknow', 'Kanpur', 'Noida', 'Agra'], zone: 'North' },
  { state: 'Haryana', code: 'HR', cities: ['Gurgaon', 'Faridabad', 'Panipat'], zone: 'North' },
  { state: 'Telangana', code: 'TS', cities: ['Hyderabad', 'Warangal', 'Nizamabad'], zone: 'South' },
  { state: 'West Bengal', code: 'WB', cities: ['Kolkata', 'Howrah', 'Durgapur'], zone: 'East' },
  { state: 'Rajasthan', code: 'RJ', cities: ['Jaipur', 'Jodhpur', 'Udaipur'], zone: 'North' }
];

const firstNames = ['Rahul', 'Amit', 'Priya', 'Sneha', 'Rohan', 'Vikram', 'Anita', 'Suresh', 'Neha', 'Rajesh', 'Pooja', 'Vikas', 'Anjali', 'Karan', 'Riya', 'Arjun', 'Kavita', 'Sanjay', 'Meera', 'Aditya'];
const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Rao', 'Gupta', 'Desai', 'Reddy', 'Menon', 'Iyer', 'Joshi', 'Nair', 'Das', 'Mehta', 'Verma', 'Chauhan', 'Bose', 'Kapoor', 'Yadav', 'Mishra'];
const garages = ['AutoCare Experts', 'FixIt Garage', 'Speed Motors', 'Reliable Auto', 'Metro Repairs', 'Elite Motors', 'QuickFix Auto', 'Prime Garage', 'City Auto Works', 'Highway Motors'];

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomPhone = () => `+91 ${Math.floor(9000000000 + Math.random() * 999999999)}`;
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];

export const dummySurveys: Survey[] = [];

let idCounter = 154315;

stages.forEach(stage => {
  // Generate more items for 'Evidence Collection' to populate the sub-tabs
  const count = stage === 'Evidence Collection' ? 60 : 20;
  
  for (let i = 0; i < count; i++) {
    const makeModel = randomItem(makesAndModels);
    const make = makeModel.make;
    const model = randomItem(makeModel.models);
    
    const locationData = randomItem(stateData);
    const state = locationData.state;
    const city = randomItem(locationData.cities);
    const zone = locationData.zone;
    const rtoCode = `${locationData.code}${String(Math.floor(Math.random() * 99) + 1).padStart(2, '0')}`;
    const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const numbers = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    const vehicleNo = `${rtoCode}${letters}${numbers}`;

    const customerName = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
    const requesterName = Math.random() > 0.3 ? customerName : `${randomItem(firstNames)} ${randomItem(lastNames)}`;
    
    let docsStatus = 'Complete';
    let photosStatus = 'Complete';
    
    if (stage === 'Survey Create/Intake') {
      docsStatus = `${Math.floor(Math.random() * 3)}/5`;
      photosStatus = '0';
    } else if (stage === 'Evidence Collection') {
      const progressType = Math.random();
      if (progressType < 0.33) {
        docsStatus = `${Math.floor(Math.random() * 4)}/5`; // Pending docs
        photosStatus = 'Complete';
      } else if (progressType < 0.66) {
        docsStatus = 'Complete';
        photosStatus = `${Math.floor(Math.random() * 10) + 1}`; // Pending photos
      } else {
        docsStatus = 'Complete';
        photosStatus = 'Complete';
      }
    }

    const requestDateStr = randomDate(new Date(2023, 9, 1), new Date(2023, 10, 30));
    const requestDate = new Date(requestDateStr);
    const lastUpdatedDate = new Date(requestDate.getTime() + Math.random() * (Date.now() - requestDate.getTime()));
    const lastUpdated = lastUpdatedDate.toISOString();

    const isHypothecated = Math.random() > 0.5 ? 'Yes' : 'No';

    dummySurveys.push({
      id: `IAR-2510-${idCounter++}`,
      ref: `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      claimNo: `CLM-${Math.floor(10000 + Math.random() * 90000)}`,
      vehicle: vehicleNo,
      insurer: randomItem(insurers),
      division: `HUB-${Math.floor(100 + Math.random() * 900)}`,
      branch: `${city} Branch`,
      ro: `${zone} Regional Office`,
      handler: randomItem(handlers),
      stage: stage as any,
      docsStatus,
      photosStatus,
      aiStatus: ['Inspection, AI Assessment & repair', 'Settlement Stage', 'Closing stage'].includes(stage) ? 'Completed' : 'Pending',
      lastUpdated,
      requestDate: requestDateStr,
      intimationDate: randomDate(new Date(2023, 9, 1), new Date(2023, 10, 30)),
      requesterName,
      requesterContact: randomPhone(),
      customerName,
      customerPhone: randomPhone(),
      policyNumber: `POL-${Math.floor(10000000 + Math.random() * 90000000)}`,
      policyPeriodStart: '2023-01-01',
      policyPeriodEnd: '2023-12-31',
      garageName: randomItem(garages),
      garageContact: randomPhone(),
      lossType: randomItem(['Repair', 'Total Loss', 'Theft', 'Third Party']),
      lossValue: Math.floor(Math.random() * 150000) + 5000,
      vehicleCategory: randomItem(['2W', '4W', 'Others']),
      vehicleClass: randomItem(['Commercial', 'Personal']),
      isHypothecated: isHypothecated === 'Yes',
      vehicleMake: make,
      vehicleModel: model,
      vehicleVersion: randomItem(['Base', 'Mid', 'Top', 'Automatic']),
      surveyLocation: city,
      zone,
      state,
      surveyor: randomItem(surveyors),
      documentCollector: randomItem(['Secure Auto', 'FastDocs', 'ClaimAssist', 'Self']),
      requestFor: randomItem(['Initial Survey', 'Final Survey', 'Re-inspection']),
      remarks: 'Standard processing.'
    });
  }
});

// Add specific combo cases to ensure all combinations are represented
const comboCases: Partial<Survey>[] = [
  { vehicleCategory: '2W', vehicleClass: 'Personal', isHypothecated: true, requestFor: 'Initial Survey' },
  { vehicleCategory: '2W', vehicleClass: 'Commercial', isHypothecated: false, requestFor: 'Final Survey' },
  { vehicleCategory: '4W', vehicleClass: 'Personal', isHypothecated: false, requestFor: 'Initial Survey' },
  { vehicleCategory: '4W', vehicleClass: 'Commercial', isHypothecated: true, requestFor: 'Re-inspection' },
  { vehicleCategory: 'Others', vehicleClass: 'Commercial', isHypothecated: true, requestFor: 'Initial Survey' },
  { vehicleCategory: '2W', vehicleClass: 'Personal', isHypothecated: false, requestFor: 'Re-inspection' },
  { vehicleCategory: '4W', vehicleClass: 'Personal', isHypothecated: true, requestFor: 'Final Survey' },
  { vehicleCategory: '4W', vehicleClass: 'Commercial', isHypothecated: false, requestFor: 'Initial Survey' },
  { vehicleCategory: 'Others', vehicleClass: 'Personal', isHypothecated: false, requestFor: 'Final Survey' },
];

comboCases.forEach((combo, index) => {
  const makeModel = randomItem(makesAndModels);
  const locationData = randomItem(stateData);
  const city = randomItem(locationData.cities);
  
  // Assign some cases to Alex Johnson (the default user) to ensure they show up in 'My Work'
  const handler = index < 3 ? 'Alex Johnson' : handlers[index % handlers.length];
  
  dummySurveys.push({
    id: `COMBO-${index + 1}`,
    ref: `REF-COMBO-${index + 1}`,
    claimNo: `CLM-C${index + 100}`,
    vehicle: `MH01AB${1000 + index}`,
    insurer: insurers[index % insurers.length],
    division: 'HUB-999',
    branch: `${city} Branch`,
    ro: `${locationData.zone} Regional Office`,
    handler: handler,
    stage: 'Evidence Collection',
    docsStatus: '2/5',
    photosStatus: '5',
    aiStatus: 'Pending',
    lastUpdated: new Date().toISOString(),
    requestDate: new Date().toISOString().split('T')[0],
    intimationDate: new Date().toISOString().split('T')[0],
    requesterName: 'Combo Tester',
    requesterContact: '+91 9999999999',
    customerName: 'Combo Customer',
    customerPhone: '+91 8888888888',
    policyNumber: `POL-COMBO-${index}`,
    policyPeriodStart: '2023-01-01',
    policyPeriodEnd: '2023-12-31',
    garageName: garages[0],
    garageContact: '+91 7777777777',
    lossType: 'Repair',
    lossValue: 50000,
    vehicleCategory: combo.vehicleCategory as any,
    vehicleClass: combo.vehicleClass as any,
    isHypothecated: combo.isHypothecated as boolean,
    vehicleMake: makeModel.make,
    vehicleModel: makeModel.models[0],
    vehicleVersion: 'Standard',
    surveyLocation: city,
    zone: locationData.zone,
    state: locationData.state,
    surveyor: surveyors[0],
    documentCollector: 'Self',
    requestFor: combo.requestFor as any,
    remarks: 'Combo test case.'
  });
});
