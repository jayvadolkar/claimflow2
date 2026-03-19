export interface SearchResult {
  id: string;
  type: 'survey' | 'claim' | 'report' | 'people' | 'navigation';
  title: string;
  description?: string;
  metadata?: Record<string, string>;
  actionUrl?: string;
}

const mockData: SearchResult[] = [
  { 
    id: 's1', 
    type: 'survey', 
    title: 'Survey #1024 - Tata AIG', 
    metadata: { 
      'Vehicle No': 'MH-01-AB-1234', 
      'Claim No': 'CL-998877', 
      'Policy No': 'POL-123456', 
      'Customer': 'John Doe', 
      'Handler': 'Jane Smith', 
      'Status': 'In Progress', 
      'Office': 'Mumbai Central' 
    } 
  },
  { 
    id: 'r1', 
    type: 'report', 
    title: 'Monthly Claims Report', 
    description: 'Summary of all claims for the current month' 
  },
  { 
    id: 'p1', 
    type: 'people', 
    title: 'Rajesh Kumar', 
    metadata: { 
      'Role': 'Surveyor', 
      'Manager': 'Amit Sharma', 
      'Phone': '+91 98765 43210', 
      'Office': 'Mumbai Branch' 
    } 
  },
  { 
    id: 'n1', 
    type: 'navigation', 
    title: 'Add New Survey', 
    actionUrl: '/new-survey' 
  },
];

export const searchService = {
  async search(query: string): Promise<SearchResult[]> {
    const lowerQuery = query.toLowerCase();
    return mockData.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) || 
      item.description?.toLowerCase().includes(lowerQuery)
    ).sort((a, b) => {
      const priority = { survey: 1, navigation: 2, report: 3, claim: 4, people: 5 };
      return (priority[a.type] || 99) - (priority[b.type] || 99);
    });
  },

  async getRecentItems(): Promise<SearchResult[]> {
    return mockData.slice(0, 3);
  }
};
